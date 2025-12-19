import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es un expert en optimisation d'articles pour la viralité. Tu reçois un article et son analyse de viralité avec des recommandations.

Ta mission: RÉÉCRIRE l'article en appliquant TOUTES les recommandations de l'analyse.

RÈGLES DE RÉÉCRITURE:
1. Applique CHAQUE recommandation fournie
2. Garde le même sujet et les mêmes informations clés
3. Améliore le SEO si score < 80 (mots-clés, structure)
4. Améliore l'engagement si score < 80 (accroches, questions, émotions)
5. Améliore la lisibilité si score < 80 (phrases courtes, bullet points)
6. Améliore la partageabilité si score < 80 (insights quotables, statistiques)

STYLE IMPOSÉ:
- Phrases courtes (max 15 mots)
- Bullet points pour les listes
- **Gras** sur les mots-clés
- Chiffres et statistiques mis en avant
- Questions rhétoriques pour l'engagement
- Accroches choc en début de section`;

// Tool definition for structured output
const improvedArticleTool = {
  type: "function" as const,
  function: {
    name: "return_improved_article",
    description: "Retourne l'article amélioré avec tous les champs requis",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Titre optimisé pour le SEO et l'engagement"
        },
        description: {
          type: "string",
          description: "Description SEO améliorée (max 150 caractères)"
        },
        slug: {
          type: "string",
          description: "URL optimisée commençant par /"
        },
        introduction: {
          type: "string",
          description: "Introduction percutante avec accroche choc"
        },
        problem: {
          type: "string",
          description: "Section problème avec bullet points et chiffres"
        },
        solution: {
          type: "string",
          description: "Solution claire avec références normatives"
        },
        bimAngle: {
          type: "string",
          description: "Angle BIM pratique avec exemple Benelux"
        },
        conclusion: {
          type: "string",
          description: "Conclusion avec CTA et question d'engagement"
        },
        technicalSources: {
          type: "string",
          description: "Sources techniques (normes, chapitres)"
        },
        altText: {
          type: "string",
          description: "Texte alternatif image optimisé (max 125 caractères)"
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
    const { articleData, viralityAnalysis } = await req.json();

    if (!articleData || !viralityAnalysis) {
      return new Response(
        JSON.stringify({ error: "Article et analyse requis" }),
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

    console.log("Improving article based on virality analysis");

    const articleContent = `
ARTICLE ACTUEL:
Titre: ${articleData.title}
Description: ${articleData.description}
Slug: ${articleData.slug}
Introduction: ${articleData.introduction}
Problème: ${articleData.problem}
Solution: ${articleData.solution}
Angle BIM: ${articleData.bimAngle}
Conclusion: ${articleData.conclusion}
Sources: ${articleData.technicalSources}
Alt Text: ${articleData.altText}
`;

    const analysisContent = `
ANALYSE DE VIRALITÉ:
Score Global: ${viralityAnalysis.globalScore}/100

Scores détaillés:
- SEO: ${viralityAnalysis.scores.seo.score}/100 - ${viralityAnalysis.scores.seo.explanation}
- Engagement: ${viralityAnalysis.scores.engagement.score}/100 - ${viralityAnalysis.scores.engagement.explanation}
- Lisibilité: ${viralityAnalysis.scores.readability.score}/100 - ${viralityAnalysis.scores.readability.explanation}
- Partageabilité: ${viralityAnalysis.scores.shareability.score}/100 - ${viralityAnalysis.scores.shareability.explanation}

RECOMMANDATIONS À APPLIQUER:
${viralityAnalysis.recommendations.map((r: { priority: string; text: string; impact: string }) => 
  `[${r.priority.toUpperCase()}] ${r.text} - Impact: ${r.impact}`
).join("\n")}
`;

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
            content: `Réécris cet article en appliquant TOUTES les recommandations:

${articleContent}

${analysisContent}`
          }
        ],
        tools: [improvedArticleTool],
        tool_choice: { type: "function", function: { name: "return_improved_article" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    if (!toolCall || toolCall.function.name !== "return_improved_article") {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Format de réponse IA inattendu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let improvedArticle;
    try {
      improvedArticle = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing de la réponse IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Article improved successfully");

    return new Response(
      JSON.stringify({ success: true, article: improvedArticle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error improving article:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
