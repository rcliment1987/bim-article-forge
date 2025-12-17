import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject } = await req.json();

    if (!subject) {
      return new Response(
        JSON.stringify({ error: "Le sujet est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, context: null, message: "Recherche contextuelle non disponible" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching context for:", subject);

    // Search queries focused on BIM news and statistics for Benelux
    const queries = [
      `${subject} BIM construction Luxembourg Belgique actualités 2024 2025`,
      `${subject} statistiques chiffres BIM Europe construction`,
      `${subject} ISO 19650 études de cas`,
    ];

    const results: string[] = [];
    const citations: string[] = [];

    for (const query of queries) {
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: "Tu es un assistant de recherche. Fournis des informations factuelles, des statistiques et des études de cas récentes sur le sujet demandé. Réponds en français. Sois concis et factuel."
              },
              { role: "user", content: query }
            ],
            search_recency_filter: "year",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            results.push(content);
          }
          if (data.citations) {
            citations.push(...data.citations);
          }
        }
      } catch (err) {
        console.error("Error in search query:", err);
      }
    }

    const contextData = {
      statistics: results[1] || "",
      recentNews: results[0] || "",
      caseStudies: results[2] || "",
      citations: [...new Set(citations)].slice(0, 10),
    };

    console.log("Context search completed, found", citations.length, "citations");

    return new Response(
      JSON.stringify({ 
        success: true, 
        context: contextData,
        hasContext: results.length > 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error searching context:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
