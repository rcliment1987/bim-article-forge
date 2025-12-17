import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es le Stratège de Contenu technique de "BIMsmarter", expert du secteur AEC (Architecture, Engineering, Construction) au Benelux.

Ta mission: Proposer des sujets d'articles pertinents et actuels sur le BIM au Luxembourg et en Belgique.

CONTEXTE BIMSMARTER:
- Cible : Directeurs Techniques, BIM Managers, Chefs de services dans les Bureaux d'Études
- Proposition de Valeur : Automatisation IA pour sécuriser les marges
- Approche : Pragmatique, "Terrain", Anti-théorie fumeuse

THÉMATIQUES CLÉS À COUVRIR:
1. Normes ISO 19650 (parties 1 à 6) - Organisation et numérisation des informations BIM
2. CDE (Common Data Environment) - Environnement de Données Commun
3. Fiches GID du CRTI-B (spécifique Luxembourg) - Conformité et paramétrage
4. DIU (Dossier d'Intervention Ultérieure) - Spécifique Belgique
5. Interopérabilité IFC et échanges de données
6. Clash Detection et coordination des maquettes
7. LOD/LOI (Level of Development/Information)
8. BIM Execution Plan (BEP) et protocoles
9. IA et automatisation dans le BIM
10. Digitalisation du secteur construction Benelux

PAIN POINTS DU MARCHÉ:
- Perte de productivité (30-40% du temps en "archéologie documentaire")
- Saisie manuelle des Fiches GID
- Fragmentation des acteurs PME
- Gestion des RFI (Demandes d'Information)
- Tri des Clashes (faux positifs)

Génère 5 suggestions de sujets d'articles en JSON, chacune avec:
- topic: Le sujet proposé (accrocheur, oppose un problème à une solution)
- angle: L'angle BIMsmarter (pragmatique, applicable au terrain)
- relevance: Pourquoi c'est pertinent maintenant pour le Benelux
- keywords: 3-5 mots-clés SEO`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating topic suggestions...");

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
            content: `Propose 5 sujets d'articles d'actualité BIM pertinents pour le Luxembourg et la Belgique en ${new Date().getFullYear()}.

Considère:
- Les évolutions réglementaires récentes (ISO 19650-6, obligations BIM dans les marchés publics)
- Les défis actuels des bureaux d'études (pénurie de talents, digitalisation)
- Les opportunités d'automatisation par l'IA
- Les spécificités locales (CRTI-B Luxembourg, normes belges)

Réponds UNIQUEMENT avec un tableau JSON contenant 5 objets avec les champs: topic, angle, relevance, keywords.`
          }
        ],
        temperature: 0.8,
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

    // Parse JSON from the response
    let suggestions;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      suggestions = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing de la réponse IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Topic suggestions generated successfully");
    return new Response(
      JSON.stringify({ success: true, suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error suggesting topics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
