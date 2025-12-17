import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Link as LinkIcon, FileText, Code, Image } from "lucide-react";
import { ArticleData } from "./ArticleForm";

interface ArticlePreviewProps {
  articleData: ArticleData;
}

const ArticlePreview = ({ articleData }: ArticlePreviewProps) => {
  const hasContent = articleData.title || articleData.introduction || articleData.problem;

  if (!hasContent) {
    return (
      <Card className="glass-panel border-primary/20 h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Eye className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Prévisualisation
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Remplissez le formulaire pour voir l'aperçu de votre article
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-primary/20 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Eye className="h-5 w-5" />
          Prévisualisation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-4 md:p-6 space-y-6">
            {/* Meta Section */}
            {(articleData.title || articleData.description || articleData.slug) && (
              <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Méta-données
                  </span>
                </div>
                
                {articleData.title && (
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    {articleData.title}
                  </h1>
                )}
                
                {articleData.description && (
                  <p className="text-sm text-muted-foreground italic">
                    {articleData.description}
                  </p>
                )}
                
                {articleData.slug && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {articleData.slug}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Article Content */}
            <article className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              {articleData.introduction && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    Introduction
                  </Badge>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {articleData.introduction}
                  </p>
                </div>
              )}

              {articleData.problem && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                    Le Problème
                  </Badge>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {articleData.problem}
                  </div>
                </div>
              )}

              {articleData.solution && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">
                    La Solution Normative
                  </Badge>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {articleData.solution}
                  </div>
                </div>
              )}

              {articleData.bimAngle && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                    Angle BIMsmarter
                  </Badge>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {articleData.bimAngle}
                  </div>
                </div>
              )}

              {articleData.conclusion && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                    Conclusion & CTA
                  </Badge>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {articleData.conclusion}
                  </div>
                </div>
              )}
            </article>

            {/* Technical Box */}
            {articleData.technicalSources && (
              <>
                <Separator className="my-4" />
                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Encadré Technique pour les Geeks
                    </span>
                  </div>
                  <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                    {articleData.technicalSources}
                  </pre>
                </div>
              </>
            )}

            {/* Alt Text */}
            {articleData.altText && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Texte Alternatif Image
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{articleData.altText}"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ArticlePreview;
