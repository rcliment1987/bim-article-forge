import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageGeneratorProps {
  subject: string;
}

interface GeneratedImage {
  type: string;
  url: string;
}

const ImageGenerator = ({ subject }: ImageGeneratorProps) => {
  const [images, setImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("cover");

  const generateImage = async (type: string) => {
    if (!subject.trim()) {
      toast.error("Veuillez d'abord entrer un sujet");
      return;
    }

    setIsLoading(prev => ({ ...prev, [type]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { subject, type },
      });

      if (error) {
        console.error("Error generating image:", error);
        toast.error("Erreur lors de la génération de l'image");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.imageUrl) {
        setImages(prev => ({ ...prev, [type]: data.imageUrl }));
        toast.success("Image générée !");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const downloadImage = (url: string, type: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `bimsmarter-${type}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Téléchargement lancé !");
  };

  const imageTypes = [
    { id: "cover", label: "Couverture", icon: Image },
    { id: "infographic", label: "Infographie", icon: Image },
    { id: "linkedin", label: "LinkedIn", icon: Image },
  ];

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Image className="h-5 w-5" />
          Génération d'Images IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50 mb-4">
            {imageTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-xs">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {imageTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="mt-0">
              <div className="space-y-3">
                <Button
                  onClick={() => generateImage(type.id)}
                  disabled={isLoading[type.id] || !subject.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isLoading[type.id] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : images[type.id] ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Régénérer l'image
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4 mr-2" />
                      Générer {type.label}
                    </>
                  )}
                </Button>

                {images[type.id] && (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={images[type.id]}
                        alt={`${type.label} générée`}
                        className="w-full h-auto"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-primary/30 hover-bim-cyan"
                      onClick={() => downloadImage(images[type.id], type.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                )}

                {!images[type.id] && !isLoading[type.id] && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {type.id === "cover" && "Image de couverture 16:9 pour le blog"}
                    {type.id === "infographic" && "Diagramme conceptuel carré"}
                    {type.id === "linkedin" && "Miniature 1:1 pour LinkedIn"}
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImageGenerator;
