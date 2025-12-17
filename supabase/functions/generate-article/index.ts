import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es le Stratège de Contenu technique de "BIMsmarter", un site de VULGARISATION et d'ÉDUCATION sur le BIM. Tu t'adresses à des Directeurs Techniques, BIM Managers et Ingénieurs au Benelux. Ton ton est pragmatique, "Ingénieur à Ingénieur", direct et sans jargon marketing vide.

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

PAIN POINTS À TRAITER (trouver le problème dans l'actualité, la solution dans les normes):
1. Le Paradoxe de Productivité : Le BIM a augmenté la densité de données, transformant les ingénieurs en "secrétaires de données"
2. La "Falaise des Talents" : Pénurie d'experts seniors + difficulté de recrutement
3. Spécificité Luxembourg : Les Fiches GID du CRTI-B - saisie manuelle des paramètres pour la conformité
4. Spécificité Belgique : Le DIU (Dossier d'Intervention Ultérieure) et la fragmentation des acteurs PME
5. Gestion Documentaire : Chaos des emails, RFI et recherche d'information (3 à 5h perdues/semaine)
6. Coordination : Tri manuel des milliers de "Clashes" (conflits géométriques)

RÈGLE D'OR: "Si un enfant de 12 ans ne comprend pas l'intérêt business, c'est que c'est trop compliqué."
STYLE: Cartésien mais accessible. Utilise des analogies si nécessaire.

Tu dois générer un article structuré en JSON avec les champs suivants:
- title: Un titre accrocheur qui oppose une douleur (Problème) à une solution (Norme/Standard)
- description: Description SEO de 150 caractères max
- slug: URL format court, minuscules, tirets
- introduction: Le Hook - constat douloureux du terrain (un problème réel identifié)
- problem: Le Problème - pourquoi la méthode "old school" échoue (exemples concrets)
- solution: La Solution Normative - la réponse des normes ISO 19650 ou CRTI-B (citer les chapitres exacts)
- bimAngle: L'Angle Pratique - comment appliquer concrètement cette norme au Benelux (vulgarisation, pas vente de service)
- conclusion: Conclusion - récapitulatif et encouragement à approfondir le sujet (PAS de CTA commercial)
- technicalSources: Sources exactes utilisées (normes, chapitres, figures, tableaux)
- altText: Texte alternatif image (max 125 caractères)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject } = await req.json();
    
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

    console.log("Generating article for subject:", subject);

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
            content: `Génère un article complet sur le sujet suivant: "${subject}"
            
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

    // Parse JSON from the response (handle markdown code blocks)
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

    console.log("Article generated successfully");
    return new Response(
      JSON.stringify({ success: true, article: articleData }),
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
