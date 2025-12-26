import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es le Stratège de Contenu technique de "BIMsmarter", expert du secteur AEC (Architecture, Engineering, Construction) au Benelux.

Ta mission: Proposer des sujets d'articles de VULGARISATION pertinents et actuels sur le BIM au Luxembourg et en Belgique, BASÉS SUR LES ACTUALITÉS RÉELLES fournies.

⚠️ RÈGLE CRITIQUE - TRÈS IMPORTANT:
BIMsmarter est un site de VULGARISATION ÉDUCATIVE, PAS un prestataire de services !
- On ne vend RIEN
- On ÉDUQUE et VULGARISE les normes BIM
- Approche obligatoire: PROBLÈME (trouvé dans l'actualité) = SOLUTION (trouvée dans les normes)

CONTEXTE BIMSMARTER:
- Cible : Directeurs Techniques, BIM Managers, Chefs de services dans les Bureaux d'Études
- Mission : Vulgariser le BIM et les normes pour permettre l'auto-formation
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

STRUCTURE DES SUGGESTIONS:
Chaque sujet doit suivre le format "PROBLÈME = SOLUTION":
- Identifier un problème concret trouvé dans les actualités fournies
- Proposer la norme/standard qui apporte la solution

Génère 5 suggestions de sujets d'articles en JSON, chacune avec:
- topic: Le sujet proposé (format: "Problème X : Comment la norme Y apporte la solution")
- angle: L'angle vulgarisation (éducatif, pas commercial - expliquer la norme simplement)
- relevance: Pourquoi c'est pertinent maintenant pour le Benelux (citer l'actualité source)
- keywords: 3-5 mots-clés SEO
- source: L'URL source de l'actualité qui a inspiré ce sujet (si disponible)`;

async function searchBIMNews(apiKey: string): Promise<{ content: string; citations: string[] }> {
  console.log("Searching for BIM news in Benelux with Perplexity...");
  
  const queries = [
    "BIM Luxembourg actualités construction 2025",
    "BIM Belgique construction numérique actualités",
    "CRTI-B Luxembourg BIM nouvelles",
    "ISO 19650 actualités Europe",
  ];

  const allCitations: string[] = [];
  const allContent: string[] = [];

  for (const query of queries) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: "Tu es un assistant de recherche. Fournis des informations factuelles et récentes sur le BIM au Benelux." },
            { role: "user", content: query }
          ],
          search_recency_filter: "month",
        }),
      });

      if (!response.ok) {
        console.error(`Perplexity search error for "${query}":`, response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const citations = data.citations || [];

      if (content) {
        allContent.push(`### Résultats pour "${query}":\n${content}`);
      }
      if (citations.length > 0) {
        allCitations.push(...citations);
      }
    } catch (error) {
      console.error(`Error searching "${query}":`, error);
    }
  }

  return {
    content: allContent.join("\n\n"),
    citations: [...new Set(allCitations)], // Remove duplicates
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante (Groq)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Search for real BIM news using Perplexity
    let newsContext = "";
    let sources: string[] = [];
    
    if (PERPLEXITY_API_KEY) {
      console.log("Perplexity API key found, searching for real news...");
      const searchResults = await searchBIMNews(PERPLEXITY_API_KEY);
      newsContext = searchResults.content;
      sources = searchResults.citations;
      console.log(`Found ${sources.length} sources from Perplexity`);
    } else {
      console.log("No Perplexity API key, using AI knowledge only");
      newsContext = "Pas d'actualités récentes disponibles. Utilise tes connaissances sur les tendances BIM au Benelux.";
    }

    // Step 2: Generate topic suggestions with Groq
    console.log("Generating topic suggestions with Groq...");

    const userPrompt = `Voici les actualités BIM récentes trouvées pour le Luxembourg et la Belgique:

${newsContext}

Sources disponibles:
${sources.length > 0 ? sources.map((s, i) => `${i + 1}. ${s}`).join("\n") : "Aucune source web trouvée"}

En te basant sur ces actualités RÉELLES, propose 5 sujets d'articles de vulgarisation BIM pertinents pour le Benelux en ${new Date().getFullYear()}.

Chaque sujet doit:
- Partir d'un PROBLÈME réel identifié dans les actualités
- Proposer une SOLUTION basée sur les normes (ISO 19650, CRTI-B, etc.)
- Être éducatif, pas commercial

Réponds UNIQUEMENT avec un tableau JSON contenant 5 objets avec les champs: topic, angle, relevance, keywords (tableau), source (URL si disponible, sinon null).`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
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

    console.log("Topic suggestions generated successfully with Groq");
    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions,
        sourcesUsed: sources.length,
        hasRealNews: sources.length > 0
      }),
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
