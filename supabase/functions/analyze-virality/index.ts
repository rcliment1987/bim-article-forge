import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es un expert en marketing de contenu et SEO pour le secteur BIM/AEC.
Analyse l'article fourni et évalue sa viralité potentielle selon 4 critères:

1. Score SEO (0-100): mots-clés pertinents, méta-description, structure H1/H2, slug optimisé
2. Score Engagement (0-100): hook accrocheur, storytelling, appel à l'action clair
3. Score Lisibilité (0-100): phrases courtes, vocabulaire accessible, structure claire
4. Score Partageabilité (0-100): potentiel de partage LinkedIn, valeur ajoutée, originalité

Pour chaque critère, fournis le score et une explication courte.
Génère aussi 3-5 recommandations concrètes d'amélioration classées par impact.

Réponds UNIQUEMENT avec un JSON valide:
{
  "scores": {
    "seo": { "score": number, "explanation": string },
    "engagement": { "score": number, "explanation": string },
    "readability": { "score": number, "explanation": string },
    "shareability": { "score": number, "explanation": string }
  },
  "globalScore": number,
  "recommendations": [
    { "priority": "high"|"medium"|"low", "text": string, "impact": string }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleData } = await req.json();

    if (!articleData || !articleData.title) {
      return new Response(
        JSON.stringify({ error: "Les données de l'article sont requises" }),
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

    console.log("Analyzing virality with Groq for:", articleData.title);

    const articleContent = `
Titre: ${articleData.title}
Description SEO: ${articleData.description}
Slug: ${articleData.slug}
Introduction: ${articleData.introduction}
Problème: ${articleData.problem}
Solution: ${articleData.solution}
Angle BIM: ${articleData.bimAngle}
Conclusion: ${articleData.conclusion}
Sources: ${articleData.technicalSources}
Alt Image: ${articleData.altText}
`;

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
          {
            role: "user",
            content: `Analyse cet article BIM destiné aux professionnels du Benelux:\n\n${articleContent}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes Groq atteinte" }),
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
      return new Response(
        JSON.stringify({ error: "Réponse IA vide" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysisData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Virality analysis completed with Groq, global score:", analysisData.globalScore);

    return new Response(
      JSON.stringify({ success: true, analysis: analysisData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing virality:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
