import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ArticleForm, { ArticleData } from "@/components/ArticleForm";
import ArticlePreview from "@/components/ArticlePreview";
import ExportActions from "@/components/ExportActions";
import TopicSuggestions from "@/components/TopicSuggestions";
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

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleReset = () => {
    setArticleData(initialArticleData);
    localStorage.removeItem("bimsmarter-article-draft");
  };

  const handleSelectTopic = (topic: string) => {
    setArticleData(prev => ({ ...prev, subject: topic }));
    toast.success("Sujet sélectionné ! Cliquez sur 'Générer l'ébauche' pour créer l'article.");
  };

  const handleGenerateArticle = async () => {
    if (!articleData.subject.trim()) {
      toast.error("Veuillez entrer un sujet d'article");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: { subject: articleData.subject },
      });

      if (error) {
        console.error("Error generating article:", error);
        toast.error("Erreur lors de la génération de l'article");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.article) {
        const article = data.article;
        setArticleData(prev => ({
          ...prev,
          title: article.title || prev.title,
          description: article.description || prev.description,
          slug: article.slug || prev.slug,
          introduction: article.introduction || prev.introduction,
          problem: article.problem || prev.problem,
          solution: article.solution || prev.solution,
          bimAngle: article.bimAngle || prev.bimAngle,
          conclusion: article.conclusion || prev.conclusion,
          technicalSources: article.technicalSources || prev.technicalSources,
          altText: article.altText || prev.altText,
        }));
        toast.success("Article généré avec succès ! Vous pouvez maintenant l'éditer.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion au service IA");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bimsmarter">
      <Header isDark={isDark} onToggleTheme={handleToggleTheme} />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Créateur d'Articles BIMsmarter
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Structurez vos articles techniques BIM selon les meilleures pratiques ISO 19650
            </p>
          </div>

          {/* Export Actions */}
          <ExportActions articleData={articleData} onReset={handleReset} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Column - Topic Suggestions */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <TopicSuggestions onSelectTopic={handleSelectTopic} />
              </div>
            </div>

            {/* Middle Column - Form */}
            <div className="lg:col-span-5">
              <ArticleForm 
                articleData={articleData} 
                onDataChange={setArticleData}
                onGenerateArticle={handleGenerateArticle}
                isGenerating={isGenerating}
              />
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <ArticlePreview articleData={articleData} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 glass-panel py-4 px-4 md:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            © 2024 BIMsmarter — Secteur AEC Benelux
          </p>
          <p className="text-xs">
            "J'aide les bureaux d'études à identifier leurs goulots d'étranglement administratifs et techniques pour sécuriser leurs marges grâce à l'IA."
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
