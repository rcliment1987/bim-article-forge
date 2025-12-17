import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Linkedin, Copy, MessageSquare, Video, Layers, Download, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArticleData } from "./ArticleForm";

interface CarouselSlide {
  slide: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface VideoScript {
  intro: string;
  problem: string;
  solution: string;
  cta: string;
}

interface LinkedInContent {
  shortPost: string;
  longPost: string;
  carousel: CarouselSlide[];
  videoScript: VideoScript;
}

interface LinkedInGeneratorProps {
  articleData: ArticleData;
}

const LinkedInGenerator = ({ articleData }: LinkedInGeneratorProps) => {
  const [content, setContent] = useState<LinkedInContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [activeTab, setActiveTab] = useState("short");

  const generateContent = async () => {
    if (!articleData.title) {
      toast.error("L'article doit avoir au moins un titre");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-linkedin", {
        body: { articleData },
      });

      if (error) {
        console.error("Error generating LinkedIn content:", error);
        toast.error("Erreur lors de la génération");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.linkedin) {
        setContent(data.linkedin);
        toast.success("Contenus LinkedIn générés !");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCarouselImages = async () => {
    if (!content?.carousel?.length) {
      toast.error("Générez d'abord le contenu LinkedIn");
      return;
    }

    setIsGeneratingSlides(true);
    const totalSlides = content.carousel.length;
    const updatedCarousel = [...content.carousel];

    try {
      for (let i = 0; i < totalSlides; i++) {
        const slide = content.carousel[i];
        toast.info(`Génération slide ${slide.slide}/${totalSlides}...`);

        const { data, error } = await supabase.functions.invoke("generate-carousel-slide", {
          body: {
            slideNumber: slide.slide,
            title: slide.title,
            content: slide.content,
            totalSlides,
          },
        });

        if (error || data?.error) {
          console.error("Error generating slide:", error || data?.error);
          toast.error(`Erreur slide ${slide.slide}`);
          continue;
        }

        if (data?.success && data.imageUrl) {
          updatedCarousel[i] = { ...slide, imageUrl: data.imageUrl };
        }
      }

      setContent({ ...content, carousel: updatedCarousel });
      toast.success("Slides générées !");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion");
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copié !`);
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const downloadAllSlides = () => {
    if (!content?.carousel) return;
    content.carousel.forEach((slide) => {
      if (slide.imageUrl) {
        downloadImage(slide.imageUrl, `slide-${slide.slide}.png`);
      }
    });
    toast.success("Téléchargement des slides...");
  };

  const hasContent = articleData.title || articleData.introduction;
  const hasSlideImages = content?.carousel?.some((s) => s.imageUrl);

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-primary">
          <span className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" />
            Générateur LinkedIn
          </span>
          <Button
            size="sm"
            onClick={generateContent}
            disabled={isLoading || !hasContent}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Générer"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!content ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Générez automatiquement des posts LinkedIn optimisés à partir de votre article
          </p>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 bg-secondary/50 mb-4">
              <TabsTrigger value="short" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Court
              </TabsTrigger>
              <TabsTrigger value="long" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Long
              </TabsTrigger>
              <TabsTrigger value="carousel" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Carousel
              </TabsTrigger>
              <TabsTrigger value="video" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                Vidéo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="short" className="mt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {content.shortPost?.length || 0}/300 caractères
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(content.shortPost, "Post court")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-sm whitespace-pre-wrap">
                  {content.shortPost}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="long" className="mt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {content.longPost?.length || 0}/1300 caractères
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(content.longPost, "Post long")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {content.longPost}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="carousel" className="mt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateCarouselImages}
                    disabled={isGeneratingSlides}
                    className="border-primary/50"
                  >
                    {isGeneratingSlides ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Image className="h-3 w-3 mr-1" />
                        Générer les images
                      </>
                    )}
                  </Button>
                  <div className="flex gap-1">
                    {hasSlideImages && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={downloadAllSlides}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(
                        content.carousel?.map(s => `Slide ${s.slide}: ${s.title}\n${s.content}`).join("\n\n") || "",
                        "Script carousel"
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier texte
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {content.carousel?.map((slide) => (
                    <div
                      key={slide.slide}
                      className="rounded-lg bg-secondary/30 border border-border/50 overflow-hidden"
                    >
                      {slide.imageUrl ? (
                        <div className="relative group">
                          <img
                            src={slide.imageUrl}
                            alt={`Slide ${slide.slide}`}
                            className="w-full aspect-square object-cover"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => downloadImage(slide.imageUrl!, `slide-${slide.slide}.png`)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                              {slide.slide}
                            </span>
                            <span className="font-medium text-xs truncate">{slide.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3">{slide.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      `INTRO (5s):\n${content.videoScript?.intro}\n\nPROBLÈME (10s):\n${content.videoScript?.problem}\n\nSOLUTION (10s):\n${content.videoScript?.solution}\n\nCTA (5s):\n${content.videoScript?.cta}`,
                      "Script vidéo"
                    )}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <div className="space-y-2">
                  {content.videoScript && (
                    <>
                      <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="text-xs font-medium text-primary">INTRO (5s)</span>
                        <p className="text-sm mt-1">{content.videoScript.intro}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="text-xs font-medium text-red-400">PROBLÈME (10s)</span>
                        <p className="text-sm mt-1">{content.videoScript.problem}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="text-xs font-medium text-green-400">SOLUTION (10s)</span>
                        <p className="text-sm mt-1">{content.videoScript.solution}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="text-xs font-medium text-yellow-400">CTA (5s)</span>
                        <p className="text-sm mt-1">{content.videoScript.cta}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedInGenerator;
