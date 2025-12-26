import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es un expert LinkedIn pour le secteur BIM/AEC. Tu dois convertir un article en plusieurs formats LinkedIn optimisés pour l'engagement.

🔥 RÈGLE OBLIGATOIRE - SIGNATURE "Be smarter...":
TOUS les posts LinkedIn (court ET long) DOIVENT se terminer par:
1. Une question d'engagement ou un CTA (ex: "Partagez votre expérience en commentaire !")
2. Une ligne vide
3. La signature: "Be smarter..."
4. Une ligne vide
5. EXACTEMENT 5 hashtags pertinents

FORMAT OBLIGATOIRE POUR TOUS LES POSTS:
[Contenu du post]

[Question d'engagement ou CTA]

Be smarter...

#Hashtag1 #Hashtag2 #Hashtag3 #Hashtag4 #Hashtag5

Génère 4 formats différents:

1. Post Court (max 300 caractères INCLUANT la signature): Accroche rapide avec emoji, question ou statistique choc + signature Be smarter + 5 hashtags
2. Post Long (max 1300 caractères INCLUANT la signature): Format storytelling LinkedIn avec:
   - Hook puissant (première ligne cruciale)
   - Histoire ou problème concret
   - Solution ou insight
   - Question d'engagement
   - Signature "Be smarter..."
   - 5 hashtags pertinents
3. Script Carousel (5-7 slides): Pour chaque slide:
   - Numéro de slide
   - Titre court et impactant (max 5 mots)
   - Texte de 2-3 phrases max
4. Script Teaser Vidéo (30 secondes):
   - Introduction (5s)
   - Problème (10s)
   - Solution (10s)
   - CTA (5s)

Réponds UNIQUEMENT avec un JSON valide:
{
  "shortPost": string,
  "longPost": string,
  "carousel": [{ "slide": number, "title": string, "content": string }],
  "videoScript": { "intro": string, "problem": string, "solution": string, "cta": string }
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

    console.log("Generating LinkedIn content with Groq for:", articleData.title);

    const articleContent = `
Titre: ${articleData.title}
Sujet: ${articleData.subject}
Introduction: ${articleData.introduction}
Problème: ${articleData.problem}
Solution: ${articleData.solution}
Angle BIM: ${articleData.bimAngle}
Conclusion: ${articleData.conclusion}
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
            content: `Convertis cet article BIM en contenus LinkedIn engageants pour les professionnels du Benelux.

RAPPEL CRITIQUE: TOUS les posts DOIVENT se terminer par:
- Question d'engagement
- "Be smarter..."
- 5 hashtags

Article:\n\n${articleContent}`
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

    let linkedinData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      linkedinData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("LinkedIn content generated successfully with Groq");

    return new Response(
      JSON.stringify({ success: true, linkedin: linkedinData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating LinkedIn content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
