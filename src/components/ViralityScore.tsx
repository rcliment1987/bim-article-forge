import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArticleData } from "./ArticleForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Score {
  score: number;
  explanation: string;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  text: string;
  impact: string;
}

interface ViralityAnalysis {
  scores: {
    seo: Score;
    engagement: Score;
    readability: Score;
    shareability: Score;
  };
  globalScore: number;
  recommendations: Recommendation[];
}

interface ViralityScoreProps {
  articleData: ArticleData;
}

const ViralityScore = ({ articleData }: ViralityScoreProps) => {
  const [analysis, setAnalysis] = useState<ViralityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const analyzeArticle = async () => {
    if (!articleData.title) {
      toast.error("L'article doit avoir au moins un titre");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-virality", {
        body: { articleData },
      });

      if (error) {
        console.error("Error analyzing:", error);
        toast.error("Erreur lors de l'analyse");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Analyse terminée !");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (priority === "medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const hasContent = articleData.title || articleData.introduction;

  return (
    <Card className="glass-panel border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <CardTitle className="flex items-center justify-between text-lg text-primary cursor-pointer hover:text-primary/80">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score de Viralité
                {analysis && (
                  <Badge className={`ml-2 ${getScoreColor(analysis.globalScore)}`}>
                    {analysis.globalScore}/100
                  </Badge>
                )}
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Button
              onClick={analyzeArticle}
              disabled={isLoading || !hasContent}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analyser la viralité
                </>
              )}
            </Button>

            {analysis && (
              <>
                {/* Score Global */}
                <div className="text-center py-4">
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.globalScore)}`}>
                    {analysis.globalScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Score Global</div>
                </div>

                {/* Individual Scores */}
                <div className="space-y-3">
                  {Object.entries(analysis.scores).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">
                          {key === "seo" ? "SEO" : 
                           key === "engagement" ? "Engagement" :
                           key === "readability" ? "Lisibilité" : "Partageabilité"}
                        </span>
                        <span className={getScoreColor(value.score)}>{value.score}/100</span>
                      </div>
                      <Progress 
                        value={value.score} 
                        className="h-2"
                        style={{
                          // @ts-ignore
                          '--progress-background': getProgressColor(value.score)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">{value.explanation}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      Recommandations
                    </div>
                    {analysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-2 rounded bg-secondary/30 border border-border/50"
                      >
                        <div className="flex items-start gap-2">
                          <Badge className={`${getPriorityColor(rec.priority)} border text-xs`}>
                            {rec.priority === "high" ? "Haute" : rec.priority === "medium" ? "Moyenne" : "Basse"}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">{rec.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rec.impact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ViralityScore;
