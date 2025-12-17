import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ArticleForm, { ArticleData } from "@/components/ArticleForm";
import ArticlePreview from "@/components/ArticlePreview";
import ExportActions from "@/components/ExportActions";

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Form Column */}
            <div>
              <ArticleForm 
                articleData={articleData} 
                onDataChange={setArticleData} 
              />
            </div>

            {/* Preview Column */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ArticlePreview articleData={articleData} />
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
