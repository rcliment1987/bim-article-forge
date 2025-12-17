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
- Mission : Vulgariser le BIM et les normes pour permettre aux professionnels de s'auto-former

PAIN POINTS À TRAITER:
1. Le Paradoxe de Productivité : Le BIM a augmenté la densité de données, transformant les ingénieurs en "secrétaires de données"
2. La "Falaise des Talents" : Pénurie d'experts seniors + difficulté de recrutement
3. Spécificité Luxembourg : Les Fiches GID du CRTI-B - saisie manuelle des paramètres pour la conformité
4. Spécificité Belgique : Le DIU (Dossier d'Intervention Ultérieure) et la fragmentation des acteurs PME
5. Gestion Documentaire : Chaos des emails, RFI et recherche d'information (3 à 5h perdues/semaine)
6. Coordination : Tri manuel des milliers de "Clashes" (conflits géométriques)

RÈGLE D'OR: "Si un enfant de 12 ans ne comprend pas l'intérêt business, c'est que c'est trop compliqué."
STYLE: Cartésien mais accessible. Utilise des analogies si nécessaire.`;

const templatePrompts: Record<string, string> = {
  standard: `Tu dois générer un article structuré en JSON avec les champs suivants. IMPORTANT: Chaque valeur doit être une CHAÎNE DE TEXTE simple, PAS un objet ou un tableau.
- title: (string) Un titre accrocheur qui oppose une douleur (Problème) à une solution (Norme/Standard)
- description: (string) Description SEO de 150 caractères max
- slug: (string) URL format court, minuscules, tirets, commençant par /
- introduction: (string) Le Hook - constat douloureux du terrain (un problème réel identifié)
- problem: (string) Le Problème - pourquoi la méthode "old school" échoue (exemples concrets)
- solution: (string) La Solution Normative - la réponse des normes ISO 19650 ou CRTI-B (citer les chapitres exacts)
- bimAngle: (string) L'Angle Pratique - comment appliquer concrètement cette norme au Benelux
- conclusion: (string) Conclusion - récapitulatif et encouragement à approfondir le sujet
- technicalSources: (string) Sources exactes utilisées (normes, chapitres, figures, tableaux)
- altText: (string) Texte alternatif image (max 125 caractères)

EXEMPLE DE FORMAT ATTENDU:
{"title": "Mon titre ici", "description": "Ma description", ...}
PAS: {"title": {"text": "...", "example": "..."}, ...}`,

  tutorial: `Tu dois générer un article TUTORIEL en JSON. Structure "Comment faire X en Y étapes":
- title: "Comment [action] : Guide pratique en [N] étapes" ou "X étapes pour [résultat]"
- description: Description SEO de 150 caractères max, promettant un guide actionnable
- slug: URL format court avec "guide" ou "comment"
- introduction: Pourquoi ce tutoriel est nécessaire, quel problème il résout
- problem: Ce qui se passe quand on n'applique pas cette méthode (échecs typiques)
- solution: Les étapes numérotées avec explications claires (Étape 1:, Étape 2:, etc.)
- bimAngle: Tips et astuces spécifiques au Benelux pour chaque étape
- conclusion: Récapitulatif des étapes et encouragement à pratiquer
- technicalSources: Références normatives pour chaque étape si applicable
- altText: Texte alternatif image (max 125 caractères)`,

  comparison: `Tu dois générer un article COMPARATIF en JSON. Structure "X vs Y":
- title: "[Option A] vs [Option B] : Lequel choisir en [contexte]?"
- description: Description SEO de 150 caractères max, promettant une comparaison objective
- slug: URL format court avec "vs" ou "comparatif"
- introduction: Pourquoi cette comparaison est pertinente, contexte du choix
- problem: Les critères de comparaison clés (coût, temps, qualité, adoption, etc.)
- solution: Tableau comparatif détaillé avec avantages/inconvénients de chaque option
- bimAngle: Recommandation pratique selon le contexte Benelux (Luxembourg vs Belgique)
- conclusion: Verdict clair avec cas d'usage recommandés pour chaque option
- technicalSources: Sources et références pour les données comparatives
- altText: Texte alternatif image (max 125 caractères)`,

  mistakes: `Tu dois générer un article "ERREURS COURANTES" en JSON. Structure "X erreurs qui...":
- title: "[N] erreurs qui [conséquence négative] (et comment les éviter)"
- description: Description SEO de 150 caractères max, promettant d'éviter des pièges
- slug: URL format court avec "erreurs" ou "pieges"
- introduction: L'impact de ces erreurs sur les projets BIM (chiffres si possible)
- problem: Liste des erreurs courantes avec exemples concrets du terrain
- solution: Pour chaque erreur : la bonne pratique à adopter selon les normes
- bimAngle: Erreurs spécifiques au contexte Benelux et solutions locales
- conclusion: Checklist récapitulative pour vérifier qu'on évite ces erreurs
- technicalSources: Références normatives pour les bonnes pratiques
- altText: Texte alternatif image (max 125 caractères)`,

  casestudy: `Tu dois générer un article "ÉTUDE DE CAS" en JSON. Structure storytelling:
- title: "Comment [type d'entreprise] a résolu [problème] avec [solution]"
- description: Description SEO de 150 caractères max, promettant un retour d'expérience
- slug: URL format court avec "etude-cas" ou nom anonymisé
- introduction: Présentation du contexte (type de projet, taille, enjeux)
- problem: La situation initiale problématique (données, timeline, défis)
- solution: La démarche adoptée étape par étape, les outils/normes utilisés
- bimAngle: Résultats obtenus (gains de temps, réduction erreurs, ROI)
- conclusion: Leçons clés à retenir et comment les appliquer à son propre contexte
- technicalSources: Standards et méthodologies référencés dans l'étude
- altText: Texte alternatif image (max 125 caractères)`,

  norm: `Tu dois générer un article "DÉCRYPTAGE NORME" en JSON. Vulgarisation d'un standard:
- title: "[Nom de la norme] expliqué simplement : Ce que ça change pour vos projets"
- description: Description SEO de 150 caractères max, promettant une vulgarisation
- slug: URL format court avec le nom de la norme
- introduction: Pourquoi cette norme existe, quel problème elle adresse
- problem: Ce qui se passait AVANT cette norme (chaos, risques, inefficacités)
- solution: Les concepts clés de la norme expliqués avec des analogies simples
- bimAngle: Comment appliquer cette norme concrètement au Benelux (GID, DIU...)
- conclusion: Les 3 points essentiels à retenir + ressources pour aller plus loin
- technicalSources: Chapitres précis de la norme avec numéros et titres
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
            content: `Génère un article complet sur le sujet suivant: "${subject}"${contextInfo}
            
Réponds UNIQUEMENT avec un objet JSON valide contenant les champs: title, description, slug, introduction, problem, solution, bimAngle, conclusion, technicalSources, altText.

Le slug doit commencer par "/" et être en minuscules avec des tirets.
La description ne doit pas dépasser 150 caractères.
L'altText ne doit pas dépasser 125 caractères.

Assure-toi que chaque section soit substantielle et pertinente pour le secteur AEC au Benelux.`
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
