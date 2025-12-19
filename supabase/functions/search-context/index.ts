import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Static BIM knowledge base for RAG enrichment
const BIM_KNOWLEDGE_BASE: Record<string, string> = {
  "iso 19650": `La norme ISO 19650 définit le cadre international de gestion de l'information BIM tout au long du cycle de vie d'un actif bâti. 
Elle comprend 6 parties :
- Partie 1 : Concepts et principes
- Partie 2 : Phase de réalisation des actifs
- Partie 3 : Phase d'exploitation des actifs
- Partie 4 : Échange d'informations
- Partie 5 : Approche de sécurité
- Partie 6 : Santé et sécurité

Concepts clés : OIR (Organizational Information Requirements), PIR (Project Information Requirements), EIR (Exchange Information Requirements), BEP (BIM Execution Plan), CDE (Common Data Environment).`,

  "lod": `Le LOD (Level of Development) définit le niveau de maturité des objets BIM :
- LOD 100 : Concept - représentation symbolique
- LOD 200 : Conception schématique - dimensions approximatives
- LOD 300 : Développement du design - dimensions précises
- LOD 350 : Documentation - coordination interdisciplinaire
- LOD 400 : Construction - détails de fabrication
- LOD 500 : As-built - vérification sur site

Au Benelux, le LOD 350 est souvent requis pour la coordination MEP.`,

  "bep": `Le BIM Execution Plan (BEP) est le document contractuel définissant :
- Les objectifs BIM du projet
- Les rôles et responsabilités
- Les standards et conventions
- Le planning des livrables
- Les processus de coordination
- La matrice de responsabilités (RACI)

Le BEP est exigé par l'ISO 19650-2 et doit être validé avant le démarrage du projet.`,

  "cde": `Le CDE (Common Data Environment) est l'environnement de données commun.
Ce n'est PAS une simple Dropbox. Le CDE structure l'information selon 4 états :
- WIP (Work In Progress) : travail en cours
- SHARED : partagé pour coordination
- PUBLISHED : approuvé pour usage
- ARCHIVED : archivé

Le CDE garantit la traçabilité et la version unique de la vérité (Single Source of Truth).`,

  "gid": `Les Fiches GID (Guide d'Information Digitale) sont spécifiques au Luxembourg.
Publiées par le CRTI-B, elles définissent :
- Les paramètres obligatoires par type d'objet
- Le format d'échange (IFC)
- Les conventions de nommage
- Les exigences de LOD

Pain point majeur : saisie manuelle des paramètres pour la conformité GID.`,

  "diu": `Le DIU (Dossier d'Intervention Ultérieure) est spécifique à la Belgique.
Document obligatoire depuis 2001, il contient :
- Plans as-built
- Fiches techniques des matériaux
- Instructions de maintenance
- Informations de sécurité pour interventions futures

Le DIU doit être mis à jour tout au long du cycle de vie du bâtiment.`,

  "ifc": `L'IFC (Industry Foundation Classes) est le standard ouvert d'échange BIM.
Format neutre permettant l'interopérabilité entre logiciels :
- IFC2x3 : version mature, largement supportée
- IFC4 : version actuelle, meilleur support géométrique
- IFC4.3 : version pour infrastructure

L'IFC est certifié buildingSMART et garantit l'échange sans perte de données.`,

  "clash": `La détection de clashes (conflits) est un processus clé de coordination BIM.
Types de clashes :
- Hard clash : intersection physique entre éléments
- Soft clash : non-respect des distances minimales
- 4D clash : conflit temporel dans le planning

Pain point : tri manuel de milliers de clashes, dont beaucoup sont des faux positifs.`,
};

const enrichWithKnowledge = (subject: string): string => {
  const lowerSubject = subject.toLowerCase();
  const matches: string[] = [];
  
  for (const [key, content] of Object.entries(BIM_KNOWLEDGE_BASE)) {
    if (lowerSubject.includes(key)) {
      matches.push(content);
    }
  }
  
  // Also check for partial matches
  const keywords = ["19650", "lod", "bep", "cde", "gid", "diu", "ifc", "clash"];
  for (const keyword of keywords) {
    if (lowerSubject.includes(keyword) && !matches.some(m => m.toLowerCase().includes(keyword))) {
      const entry = Object.entries(BIM_KNOWLEDGE_BASE).find(([k]) => k.includes(keyword));
      if (entry) matches.push(entry[1]);
    }
  }
  
  return matches.join("\n\n---\n\n");
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

    console.log("Searching context for:", subject);

    // First, enrich with static knowledge base
    const staticKnowledge = enrichWithKnowledge(subject);
    console.log("Static knowledge matches:", staticKnowledge ? "Yes" : "None");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    // If no API key, return just static knowledge
    if (!PERPLEXITY_API_KEY) {
      console.log("PERPLEXITY_API_KEY not configured, using static knowledge only");
      
      if (staticKnowledge) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            context: {
              statistics: "",
              recentNews: "",
              caseStudies: "",
              citations: [],
              staticKnowledge,
            },
            hasContext: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, context: null, message: "Recherche contextuelle non disponible" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      staticKnowledge,
    };

    console.log("Context search completed, found", citations.length, "citations");

    return new Response(
      JSON.stringify({ 
        success: true, 
        context: contextData,
        hasContext: results.length > 0 || !!staticKnowledge
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
