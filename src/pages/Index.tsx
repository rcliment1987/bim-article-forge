import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ArticleForm, { ArticleData } from "@/components/ArticleForm";
import ArticlePreview from "@/components/ArticlePreview";
import ExportActions from "@/components/ExportActions";
import TopicSuggestions from "@/components/TopicSuggestions";
import TemplateSelector, { ArticleTemplate } from "@/components/TemplateSelector";
import TitleGenerator from "@/components/TitleGenerator";
import ViralityScore from "@/components/ViralityScore";
import LinkedInGenerator from "@/components/LinkedInGenerator";
import ImageGenerator from "@/components/ImageGenerator";
import ArticleHistory from "@/components/ArticleHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const initialArticleData: ArticleData = {
  subject: "",
  title: "",
  description: "",
  slug: "",
  introduction: "",
  problem: "",
  solution: "",
  bimAngle: "",
  conclusion: "",
  technicalSources: "",
  altText: "",
};

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ArticleTemplate>("standard");
  const [articleData, setArticleData] = useState<ArticleData>(() => {
    const saved = localStorage.getItem("bimsmarter-article-draft");
    return saved ? JSON.parse(saved) : initialArticleData;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("bimsmarter-article-draft", JSON.stringify(articleData));
  }, [articleData]);

  const handleToggleTheme = () => setIsDark(!isDark);
  const handleReset = () => {
    setArticleData(initialArticleData);
    localStorage.removeItem("bimsmarter-article-draft");
  };
  const handleSelectTopic = (topic: string) => {
    setArticleData(prev => ({ ...prev, subject: topic }));
    toast.success("Sujet sélectionné !");
  };
  const handleSelectTitle = (title: string) => {
    setArticleData(prev => ({ ...prev, title }));
    toast.success("Titre appliqué !");
  };

  const handleGenerateArticle = async () => {
    if (!articleData.subject.trim()) {
      toast.error("Veuillez entrer un sujet d'article");
      return;
    }

    setIsGenerating(true);
    try {
      // First, search for context
      let context = null;
      try {
        const { data: contextData } = await supabase.functions.invoke("search-context", {
          body: { subject: articleData.subject },
        });
        if (contextData?.success && contextData.context) {
          context = contextData.context;
        }
      } catch (e) {
        console.log("Context search skipped");
      }

      // Generate article with template and context
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: { subject: articleData.subject, template: selectedTemplate, context },
      });

      if (error) {
        toast.error("Erreur lors de la génération");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.success && data.article) {
        const article = data.article;
        // Helper to ensure value is string (AI may return objects)
        const ensureString = (val: unknown): string => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object') return JSON.stringify(val, null, 2);
          return '';
        };
        setArticleData(prev => ({
          ...prev,
          title: ensureString(article.title) || prev.title,
          description: ensureString(article.description) || prev.description,
          slug: ensureString(article.slug) || prev.slug,
          introduction: ensureString(article.introduction) || prev.introduction,
          problem: ensureString(article.problem) || prev.problem,
          solution: ensureString(article.solution) || prev.solution,
          bimAngle: ensureString(article.bimAngle) || prev.bimAngle,
          conclusion: ensureString(article.conclusion) || prev.conclusion,
          technicalSources: ensureString(article.technicalSources) || prev.technicalSources,
          altText: ensureString(article.altText) || prev.altText,
        }));
        toast.success("Article généré avec enrichissement contextuel !");
      }
    } catch (err) {
      toast.error("Erreur de connexion");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bimsmarter">
      <Header isDark={isDark} onToggleTheme={handleToggleTheme} />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Créateur d'Articles Viraux BIMsmarter
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Générez des articles BIM optimisés pour l'engagement et le SEO
            </p>
          </div>

          <ExportActions articleData={articleData} onReset={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-4">
              <TopicSuggestions onSelectTopic={handleSelectTopic} />
              <ArticleHistory 
                currentArticle={articleData} 
                onLoadArticle={setArticleData}
                onSaveArticle={() => {}}
              />
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-5 space-y-4">
              <TemplateSelector selectedTemplate={selectedTemplate} onSelectTemplate={setSelectedTemplate} />
              <ArticleForm 
                articleData={articleData} 
                onDataChange={setArticleData}
                onGenerateArticle={handleGenerateArticle}
                isGenerating={isGenerating}
              />
              <TitleGenerator 
                subject={articleData.subject}
                currentTitle={articleData.title}
                onSelectTitle={handleSelectTitle}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-4">
              <ArticlePreview articleData={articleData} />
              <ViralityScore articleData={articleData} />
              <LinkedInGenerator articleData={articleData} />
              <ImageGenerator subject={articleData.subject} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-primary/20 glass-panel py-4 px-4">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>© 2024 BIMsmarter — Secteur AEC Benelux</p>
          <p className="text-xs">"Vulgariser le BIM pour permettre aux professionnels de s'auto-former."</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
