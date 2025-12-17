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

const templatePrompts: Record<string, string> = {
  standard: `Tu dois générer un article COURT et PERCUTANT en JSON avec les champs suivants:
- title: (string) Titre accrocheur avec chiffre ou question (max 60 caractères)
- description: (string) Description SEO de 150 caractères max
- slug: (string) URL format court, minuscules, tirets, commençant par /
- introduction: (string) 2-3 phrases max. COMMENCER par un chiffre choc ou une question provocante
- problem: (string) 80-100 mots max. Phrases courtes. Utiliser des bullet points
- solution: (string) 80-100 mots max. Citer UNE norme précise avec chapitre. Format scannable
- bimAngle: (string) 80-100 mots max. Exemple concret Benelux. Actionnable immédiatement
- conclusion: (string) 2-3 phrases. Un takeaway clair + question d'engagement
- technicalSources: (string) Sources exactes (norme + chapitre)
- altText: (string) Texte alternatif image (max 125 caractères)

EXEMPLE DE FORMAT ATTENDU:
{"title": "Mon titre ici", "description": "Ma description", ...}`,

  tutorial: `Tu dois générer un article TUTORIEL COURT en JSON:
- title: "Comment [action] en [N] étapes" (max 60 caractères)
- description: Description SEO de 150 caractères max
- slug: URL format court avec "guide" ou "comment"
- introduction: 2 phrases max. Problème + promesse de solution rapide
- problem: 60-80 mots. Ce qui échoue quand on ne suit pas la méthode
- solution: Les étapes NUMÉROTÉES (max 5 étapes). 1 phrase par étape
- bimAngle: Tips spécifiques Benelux. 60-80 mots max
- conclusion: 2 phrases. Récap + question d'engagement
- technicalSources: Références normatives
- altText: Texte alternatif image (max 125 caractères)`,

  comparison: `Tu dois générer un article COMPARATIF COURT en JSON:
- title: "[A] vs [B] : Lequel choisir ?" (max 60 caractères)
- description: Description SEO de 150 caractères max
- slug: URL format court avec "vs"
- introduction: 2 phrases. Pourquoi ce choix est crucial
- problem: Tableau mental en bullet points : critères clés (3-4 max)
- solution: Avantages/inconvénients en bullet points. Court et direct
- bimAngle: VERDICT clair selon contexte Luxembourg ou Belgique
- conclusion: Recommandation en 1 phrase + question d'engagement
- technicalSources: Sources comparatives
- altText: Texte alternatif image (max 125 caractères)`,

  mistakes: `Tu dois générer un article "ERREURS" COURT en JSON:
- title: "[N] erreurs qui [conséquence]" (max 60 caractères)
- description: Description SEO de 150 caractères max
- slug: URL avec "erreurs" ou "pieges"
- introduction: 2 phrases. Chiffre d'impact + accroche
- problem: Liste NUMÉROTÉE des erreurs (max 5). 1-2 phrases par erreur
- solution: Pour chaque erreur : la correction en 1 phrase
- bimAngle: Erreur spécifique Benelux + solution locale
- conclusion: 2 phrases. Checklist mentale + question
- technicalSources: Références normatives
- altText: Texte alternatif image (max 125 caractères)`,

  casestudy: `Tu dois générer une ÉTUDE DE CAS COURTE en JSON:
- title: "Comment [entreprise] a résolu [problème]" (max 60 caractères)
- description: Description SEO de 150 caractères max
- slug: URL avec "etude-cas"
- introduction: 2 phrases. Le défi + le résultat chiffré
- problem: 60-80 mots. Situation initiale problématique
- solution: 80-100 mots. Les 3 actions clés prises
- bimAngle: Résultats chiffrés : temps gagné, erreurs réduites, ROI
- conclusion: Leçon à retenir en 1 phrase + question
- technicalSources: Standards utilisés
- altText: Texte alternatif image (max 125 caractères)`,

  norm: `Tu dois générer un DÉCRYPTAGE NORME COURT en JSON:
- title: "[Norme] expliquée simplement" (max 60 caractères)
- description: Description SEO de 150 caractères max
- slug: URL avec nom de la norme
- introduction: 2 phrases. Pourquoi cette norme vous concerne
- problem: 60-80 mots. L'AVANT (chaos sans la norme)
- solution: 3-4 concepts clés MAX. 1 phrase par concept. Analogies simples
- bimAngle: Application Benelux : GID ou DIU selon contexte
- conclusion: Les 3 points à retenir + question
- technicalSources: Chapitres précis de la norme
- altText: Texte alternatif image (max 125 caractères)`
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

    const templatePrompt = templatePrompts[template] || templatePrompts.standard;
    const systemPrompt = `${baseSystemPrompt}\n\n${templatePrompt}`;

    let contextInfo = "";
    if (context) {
      contextInfo = `\n\nINFORMATIONS CONTEXTUELLES RÉCENTES:
${context.recentNews ? `Actualités récentes:\n${context.recentNews}\n` : ""}
${context.statistics ? `Statistiques:\n${context.statistics}\n` : ""}
${context.caseStudies ? `Études de cas:\n${context.caseStudies}\n` : ""}
${context.citations?.length ? `Sources web:\n${context.citations.join("\n")}\n` : ""}

Utilise ces informations pour enrichir l'article avec des données récentes et des références actuelles.`;
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
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Génère un article COURT et PERCUTANT sur: "${subject}"${contextInfo}

RAPPEL CRITIQUE:
- Introduction : 2-3 phrases MAX
- Chaque section : 80-120 mots MAX
- Phrases courtes (15 mots max)
- COMMENCE par un chiffre ou une question choc
- Format scannable avec bullet points

Réponds UNIQUEMENT avec un objet JSON valide.`
          }
        ],
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Réponse IA vide" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let articleData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      articleData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
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
