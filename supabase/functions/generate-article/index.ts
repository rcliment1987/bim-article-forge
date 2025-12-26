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
- Questions rhétoriques qui font réfléchir

IMPORTANT: Tu dois TOUJOURS répondre avec un JSON valide contenant les champs suivants:
{
  "title": "Titre accrocheur avec chiffre ou question (max 60 caractères)",
  "description": "Description SEO de 150 caractères max",
  "slug": "URL format court, minuscules, tirets, commençant par /",
  "introduction": "2-3 phrases max. COMMENCER par un chiffre choc ou une question provocante",
  "problem": "80-100 mots max. Phrases courtes. Utiliser des bullet points",
  "solution": "80-100 mots max. Citer UNE norme précise avec chapitre. Format scannable",
  "bimAngle": "80-100 mots max. Exemple concret Benelux. Actionnable immédiatement",
  "conclusion": "2-3 phrases. Un takeaway clair + question d'engagement",
  "technicalSources": "Sources exactes (norme + chapitre)",
  "altText": "Texte alternatif image (max 125 caractères)"
}`;

const templateDescriptions: Record<string, string> = {
  standard: "Article standard avec structure classique : introduction, problème, solution, angle BIM, conclusion",
  tutorial: "Tutoriel étape par étape avec format 'Comment faire X en N étapes'",
  comparison: "Article comparatif avec format 'A vs B : Lequel choisir ?'",
  mistakes: "Article sur les erreurs courantes avec format 'N erreurs qui [conséquence]'",
  casestudy: "Étude de cas avec format 'Comment [entreprise] a résolu [problème]'",
  norm: "Décryptage d'une norme avec format '[Norme] expliquée simplement'",
};

function extractJSON(content: string): Record<string, unknown> | null {
  // Try to extract JSON from markdown code blocks first
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      console.log("Failed to parse JSON from code block");
    }
  }
  
  // Try to find JSON object directly
  const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {
      console.log("Failed to parse JSON object directly");
    }
  }
  
  return null;
}

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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante (Groq)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating article with Groq for subject:", subject, "template:", template);

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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
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
- Format scannable avec bullet points

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes Groq atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur du service IA Groq" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in Groq response");
      return new Response(
        JSON.stringify({ error: "Réponse IA vide" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const articleData = extractJSON(content);
    if (!articleData) {
      console.error("Failed to parse article JSON:", content);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing de la réponse IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Article generated successfully with Groq, template:", template);
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
