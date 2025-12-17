import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Loader2, RefreshCw, ArrowRight, ExternalLink, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopicSuggestion {
  topic: string;
  angle: string;
  relevance: string;
  keywords: string[];
  source?: string | null;
}

interface TopicSuggestionsProps {
  onSelectTopic: (topic: string) => void;
}

const TopicSuggestions = ({ onSelectTopic }: TopicSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasRealNews, setHasRealNews] = useState(false);
  const [sourcesCount, setSourcesCount] = useState(0);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-topics");

      if (error) {
        console.error("Error fetching suggestions:", error);
        toast.error("Erreur lors de la récupération des suggestions");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setHasLoaded(true);
        setHasRealNews(data.hasRealNews || false);
        setSourcesCount(data.sourcesUsed || 0);
        toast.success(
          data.hasRealNews 
            ? `Suggestions générées à partir de ${data.sourcesUsed} sources web réelles !`
            : "Suggestions générées avec succès !"
        );
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion au service IA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Lightbulb className="h-5 w-5" />
            Suggestions d'articles IA
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="border-primary/30 hover-bim-cyan"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasLoaded ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              "Générer"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          L'IA recherche l'actualité BIM au Benelux pour vous proposer des sujets pertinents
        </p>
        {hasLoaded && hasRealNews && (
          <div className="flex items-center gap-1.5 mt-2">
            <Globe className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-green-500 font-medium">
              {sourcesCount} sources web analysées
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasLoaded && !isLoading ? (
          <div className="text-center py-6">
            <Lightbulb className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Générer" pour obtenir des suggestions basées sur l'actualité BIM réelle
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-6">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Recherche des actualités BIM et génération des suggestions...
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className="bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => onSelectTopic(suggestion.topic)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground leading-tight">
                        {suggestion.topic}
                      </h4>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-primary/80">Angle:</span> {suggestion.angle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-primary/80">Pertinence:</span> {suggestion.relevance}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.keywords?.map((keyword, kIndex) => (
                        <Badge
                          key={kIndex}
                          variant="outline"
                          className="text-[10px] border-primary/20 text-muted-foreground"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {suggestion.source && (
                      <a
                        href={suggestion.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{suggestion.source}</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicSuggestions;
