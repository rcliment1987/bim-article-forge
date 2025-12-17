import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TitleVariant {
  text: string;
  score: number;
  reasoning: string;
}

interface TitleGeneratorProps {
  subject: string;
  currentTitle: string;
  onSelectTitle: (title: string) => void;
}

const TitleGenerator = ({ subject, currentTitle, onSelectTitle }: TitleGeneratorProps) => {
  const [titles, setTitles] = useState<TitleVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateTitles = async () => {
    if (!subject.trim()) {
      toast.error("Veuillez d'abord entrer un sujet");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-titles", {
        body: { subject, currentTitle },
      });

      if (error) {
        console.error("Error generating titles:", error);
        toast.error("Erreur lors de la génération des titres");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.titles) {
        setTitles(data.titles);
        toast.success(`${data.titles.length} variantes générées !`);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const copyTitle = async (title: string) => {
    await navigator.clipboard.writeText(title);
    toast.success("Titre copié !");
  };

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-primary">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Générateur de Titres A/B
          </span>
          <Button
            size="sm"
            onClick={generateTitles}
            disabled={isLoading || !subject.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Générer 5 variantes"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {titles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Cliquez sur "Générer" pour obtenir 5 variantes de titres avec scores de clicabilité
          </p>
        ) : (
          <div className="space-y-2">
            {titles.map((title, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{title.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{title.reasoning}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${getScoreColor(title.score)} border`}>
                      {title.score}/100
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => copyTitle(title.text)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-primary/20"
                      onClick={() => onSelectTitle(title.text)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TitleGenerator;
