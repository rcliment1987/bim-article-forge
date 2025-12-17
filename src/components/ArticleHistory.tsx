import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { ArticleData } from "./ArticleForm";

interface SavedArticle {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  data: ArticleData;
}

interface ArticleHistoryProps {
  currentArticle: ArticleData;
  onLoadArticle: (data: ArticleData) => void;
  onSaveArticle: () => void;
}

const STORAGE_KEY = "bimsmarter-article-history";
const MAX_HISTORY = 10;

const ArticleHistory = ({ currentArticle, onLoadArticle, onSaveArticle }: ArticleHistoryProps) => {
  const [history, setHistory] = useState<SavedArticle[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history:", e);
      }
    }
  }, []);

  const saveToHistory = () => {
    if (!currentArticle.title && !currentArticle.subject) {
      toast.error("L'article doit avoir au moins un titre ou un sujet");
      return;
    }

    const newEntry: SavedArticle = {
      id: Date.now().toString(),
      title: currentArticle.title || currentArticle.subject || "Sans titre",
      subject: currentArticle.subject,
      createdAt: new Date().toISOString(),
      data: currentArticle,
    };

    const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    toast.success("Article sauvegardé !");
    onSaveArticle();
  };

  const loadFromHistory = (article: SavedArticle) => {
    onLoadArticle(article.data);
    toast.success("Article chargé !");
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter((a) => a.id !== id);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    toast.success("Article supprimé de l'historique");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-primary">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique
          </span>
          <Button
            size="sm"
            onClick={saveToHistory}
            className="bg-primary hover:bg-primary/90"
          >
            Sauvegarder
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun article sauvegardé. Cliquez sur "Sauvegarder" pour conserver votre travail.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {history.map((article) => (
              <div
                key={article.id}
                className="p-2 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => loadFromHistory(article)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="font-medium text-sm truncate">{article.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFromHistory(article.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {history.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {history.length}/{MAX_HISTORY} articles sauvegardés
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ArticleHistory;
