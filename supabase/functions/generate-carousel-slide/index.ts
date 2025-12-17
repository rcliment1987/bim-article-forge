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
    const { slideNumber, title, content, totalSlides } = await req.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Titre et contenu requis" }),
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

    console.log("Generating carousel slide:", slideNumber, title);

    const prompt = `Create a professional LinkedIn carousel slide image for BIM/construction professionals.

SLIDE DETAILS:
- Slide number: ${slideNumber}/${totalSlides}
- Title: "${title}"
- Content: "${content}"

DESIGN REQUIREMENTS:
- Background: Dark gradient from #1e3a5f to #0f172a
- Accent color: Cyan #0891b2
- Show slide number "${slideNumber}" in top-right corner in a cyan circle
- Display the title "${title}" in large, bold white text (centered, top third)
- Display the content below in smaller white text (centered, readable)
- Add subtle geometric/tech design elements (lines, dots, abstract shapes)
- Professional, modern, tech-forward aesthetic
- All text in FRENCH with PERFECT SPELLING
- Text must be highly readable and well-spaced
- Format: Square 1:1 (1080x1080 for LinkedIn)
- Include "BIMsmarter" watermark in bottom-right corner (small, subtle)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
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
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response");
      return new Response(
        JSON.stringify({ error: "Aucune image générée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Carousel slide generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, slideNumber }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating carousel slide:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
