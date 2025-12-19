import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const baseSystemPrompt = `Tu es le Stratège de Contenu technique de "BIMsmarter", un site de VULGARISATION et d'ÉDUCATION sur le BIM. Tu t'adresses à des Directeurs Techniques, BIM Managers et Ingénieurs au Benelux. Ton ton est pragmatique, "Ingénieur à Ingénieur", direct et sans jargon marketing vide.

⚠️ RÈGLE CRITIQUE - TRÈS IMPORTANT:
BIMsmarter NE VEND AUCUN SERVICE ! BIMsmarter est UNIQUEMENT:
- Un site de vulgarisation du BIM et des normes en vigueur
- Une plateforme proposant des outils interactifs GRATUITS
- Un média éducatif, PAS un prestataire de services

JAMAIS utiliser des formulations comme:
- "Chez BIMsmarter, nous vous aidons à..."
- "Nous proposons/offrons/fournissons..."
- "Notre équipe peut..."
- "Contactez-nous pour un audit..."

TOUJOURS utiliser l'approche: PROBLÈME = SOLUTION
- Identifier un problème concret du terrain (actualité, retour d'expérience)
- Expliquer la solution via les normes (ISO 19650, CRTI-B, etc.)
- Vulgariser de manière accessible et pratique

POSITIONNEMENT BIMSMARTER:
- Secteur : AEC (Architecture, Engineering, Construction)
- Niche géographique : Luxembourg & Belgique (Focus Benelux)
- Cible : Directeurs Techniques, BIM Managers et Chefs de services dans les Bureaux d'Études Techniques
- Mission : Vulgariser le BIM pour permettre aux professionnels de s'auto-former

PAIN POINTS À TRAITER:
1. Le Paradoxe de Productivité : Le BIM a augmenté la densité de données, transformant les ingénieurs en "secrétaires de données"
2. La "Falaise des Talents" : Pénurie d'experts seniors + difficulté de recrutement
3. Spécificité Luxembourg : Les Fiches GID du CRTI-B - saisie manuelle des paramètres pour la conformité
4. Spécificité Belgique : Le DIU (Dossier d'Intervention Ultérieure) et la fragmentation des acteurs PME
5. Gestion Documentaire : Chaos des emails, RFI et recherche d'information (3 à 5h perdues/semaine)
6. Coordination : Tri manuel des milliers de "Clashes" (conflits géométriques)

RÈGLE D'OR: "Si un enfant de 12 ans ne comprend pas l'intérêt business, c'est que c'est trop compliqué."

🔥 STYLE RÉDACTIONNEL - ARTICLES PERCUTANTS:

📏 FORMAT COURT & IMPACTANT:
- Introduction : 2-3 phrases MAXIMUM, droit au but
- Chaque section : 80-120 mots max (PAS PLUS !)
- Phrases courtes : 15 mots maximum par phrase
- Un paragraphe = une seule idée

🎯 ACCROCHES CHOC (OBLIGATOIRE):
- TOUJOURS commencer par un chiffre frappant OU une question provocante
- Exemples : "80% des projets BIM dépassent leur budget." | "Et si votre BEP était obsolète depuis 6 mois ?"
- JAMAIS de contexte long en intro

💡 STYLE "SCROLLABLE":
- Utiliser des listes à puces (3-5 points max par liste)
- Mettre en **gras** les mots-clés importants
- Structure pyramide inversée : l'essentiel EN PREMIER
- Chaque paragraphe doit pouvoir se lire seul

🚫 INTERDITS:
- Les longues introductions contextuelles
- Les phrases > 20 mots
- Le jargon non expliqué immédiatement
- Les transitions molles ("Il convient de noter...", "Il est important de...", "Dans le contexte actuel...")
- Les répétitions et redondances
- Les paragraphes > 4 lignes

✅ PRIVILÉGIER:
- Verbes d'action directs
- Exemples ultra-concrets (1 phrase max)
- Analogies simples ("Le BEP = la recette de cuisine du projet")
- Chiffres et statistiques percutants
- Questions rhétoriques qui font réfléchir`;

const templateDescriptions: Record<string, string> = {
  standard: "Article standard avec structure classique : introduction, problème, solution, angle BIM, conclusion",
  tutorial: "Tutoriel étape par étape avec format 'Comment faire X en N étapes'",
  comparison: "Article comparatif avec format 'A vs B : Lequel choisir ?'",
  mistakes: "Article sur les erreurs courantes avec format 'N erreurs qui [conséquence]'",
  casestudy: "Étude de cas avec format 'Comment [entreprise] a résolu [problème]'",
  norm: "Décryptage d'une norme avec format '[Norme] expliquée simplement'",
};

// Tool definition for structured output
const articleTool = {
  type: "function" as const,
  function: {
    name: "generate_article",
    description: "Génère un article BIM structuré et optimisé pour la viralité",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Titre accrocheur avec chiffre ou question (max 60 caractères)"
        },
        description: {
          type: "string",
          description: "Description SEO de 150 caractères max"
        },
        slug: {
          type: "string",
          description: "URL format court, minuscules, tirets, commençant par /"
        },
        introduction: {
          type: "string",
          description: "2-3 phrases max. COMMENCER par un chiffre choc ou une question provocante"
        },
        problem: {
          type: "string",
          description: "80-100 mots max. Phrases courtes. Utiliser des bullet points"
        },
        solution: {
          type: "string",
          description: "80-100 mots max. Citer UNE norme précise avec chapitre. Format scannable"
        },
        bimAngle: {
          type: "string",
          description: "80-100 mots max. Exemple concret Benelux. Actionnable immédiatement"
        },
        conclusion: {
          type: "string",
          description: "2-3 phrases. Un takeaway clair + question d'engagement"
        },
        technicalSources: {
          type: "string",
          description: "Sources exactes (norme + chapitre)"
        },
        altText: {
          type: "string",
          description: "Texte alternatif image (max 125 caractères)"
        }
      },
      required: ["title", "description", "slug", "introduction", "problem", "solution", "bimAngle", "conclusion", "technicalSources", "altText"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, template = "standard", context } = await req.json();
    
    if (!subject) {
      return new Response(
        JSON.stringify({ error: "Le sujet de l'article est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating article for subject:", subject, "template:", template);

    const templateDesc = templateDescriptions[template] || templateDescriptions.standard;

    let contextInfo = "";
    if (context) {
      const parts: string[] = [];
      if (context.staticKnowledge) parts.push(`Base de connaissances BIM:\n${context.staticKnowledge}`);
      if (context.recentNews) parts.push(`Actualités récentes:\n${context.recentNews}`);
      if (context.statistics) parts.push(`Statistiques:\n${context.statistics}`);
      if (context.caseStudies) parts.push(`Études de cas:\n${context.caseStudies}`);
      if (context.citations?.length) parts.push(`Sources web:\n${context.citations.join("\n")}`);
      
      if (parts.length > 0) {
        contextInfo = `\n\nINFORMATIONS CONTEXTUELLES:\n${parts.join("\n\n")}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: baseSystemPrompt },
          { 
            role: "user", 
            content: `Génère un article COURT et PERCUTANT sur: "${subject}"

Type d'article: ${templateDesc}
${contextInfo}

RAPPEL CRITIQUE:
- Introduction : 2-3 phrases MAX
- Chaque section : 80-120 mots MAX
- Phrases courtes (15 mots max)
- COMMENCE par un chiffre ou une question choc
- Format scannable avec bullet points`
          }
        ],
        tools: [articleTool],
        tool_choice: { type: "function", function: { name: "generate_article" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Veuillez recharger votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_article") {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Format de réponse IA inattendu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let articleData;
    try {
      articleData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing de la réponse IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Article generated successfully with template:", template);
    return new Response(
      JSON.stringify({ success: true, article: articleData, template }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating article:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
