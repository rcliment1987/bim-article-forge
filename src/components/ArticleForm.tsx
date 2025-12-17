import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, FileText, Image, BookOpen, Code, Target } from "lucide-react";

export interface ArticleData {
  subject: string;
  title: string;
  description: string;
  slug: string;
  introduction: string;
  problem: string;
  solution: string;
  bimAngle: string;
  conclusion: string;
  technicalSources: string;
  altText: string;
}

interface ArticleFormProps {
  articleData: ArticleData;
  onDataChange: (data: ArticleData) => void;
}

const ArticleForm = ({ articleData, onDataChange }: ArticleFormProps) => {
  const [activeTab, setActiveTab] = useState("meta");

  const handleChange = (field: keyof ArticleData, value: string) => {
    onDataChange({ ...articleData, [field]: value });
  };

  const generateSlug = () => {
    const slug = articleData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    handleChange("slug", `/${slug}`);
  };

  return (
    <div className="space-y-4">
      {/* Subject Input - Always Visible */}
      <Card className="glass-panel border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Target className="h-5 w-5" />
            Sujet de l'article
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Décrivez le sujet de votre article (ex: Le CDE n'est pas une Dropbox, L'importance des Fiches GID au Luxembourg...)"
            value={articleData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            className="min-h-[80px] bg-input/50 border-border focus:border-primary"
          />
        </CardContent>
      </Card>

      {/* Tabbed Form Sections */}
      <Card className="glass-panel border-primary/20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-3">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 bg-secondary/50">
              <TabsTrigger value="meta" className="flex items-center gap-1 text-xs md:text-sm">
                <FileText className="h-4 w-4 hidden md:block" />
                Méta
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-1 text-xs md:text-sm">
                <BookOpen className="h-4 w-4 hidden md:block" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="angle" className="flex items-center gap-1 text-xs md:text-sm">
                <Sparkles className="h-4 w-4 hidden md:block" />
                Angle BIM
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1 text-xs md:text-sm">
                <Code className="h-4 w-4 hidden md:block" />
                Technique
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1 text-xs md:text-sm">
                <Image className="h-4 w-4 hidden md:block" />
                Image
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Meta Tab */}
            <TabsContent value="meta" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Post Title (H1)
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Le CDE n'est pas une Dropbox : Votre assurance-vie juridique sur les projets BIM"
                  value={articleData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="bg-input/50 border-border focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Un titre accrocheur qui oppose une douleur (Chaos) à une solution (Norme)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Post Description (SEO) — {articleData.description.length}/150 caractères
                </Label>
                <Textarea
                  id="description"
                  placeholder="Description incitative de 150 caractères max..."
                  value={articleData.description}
                  onChange={(e) => handleChange("description", e.target.value.slice(0, 150))}
                  className="min-h-[60px] bg-input/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Post URL (Slug)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    placeholder="/le-cde-nest-pas-une-dropbox"
                    value={articleData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    className="bg-input/50 border-border focus:border-primary"
                  />
                  <Button
                    variant="outline"
                    onClick={generateSlug}
                    className="border-primary/30 hover-bim-cyan whitespace-nowrap"
                  >
                    Générer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="introduction" className="text-sm font-medium">
                  Introduction (Le Hook)
                </Label>
                <Textarea
                  id="introduction"
                  placeholder="Pars d'un constat douloureux du terrain (perte de temps, risque juridique, erreur chantier). Cite un chiffre si pertinent."
                  value={articleData.introduction}
                  onChange={(e) => handleChange("introduction", e.target.value)}
                  className="min-h-[120px] bg-input/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem" className="text-sm font-medium">
                  Le Problème (Agitation)
                </Label>
                <Textarea
                  id="problem"
                  placeholder='Explique pourquoi la méthode "old school" échoue (Excel, Email, WeTransfer)...'
                  value={articleData.problem}
                  onChange={(e) => handleChange("problem", e.target.value)}
                  className="min-h-[120px] bg-input/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution" className="text-sm font-medium">
                  La Solution Normative (L'Autorité)
                </Label>
                <Textarea
                  id="solution"
                  placeholder='Explique le concept clé de la norme ISO, de la prescription CRTI-B ou toute autre norme concernée. Sois précis (cite le nom du concept, ex: "Trigger Event", "Federation Strategy").'
                  value={articleData.solution}
                  onChange={(e) => handleChange("solution", e.target.value)}
                  className="min-h-[150px] bg-input/50 border-border focus:border-primary"
                />
              </div>
            </TabsContent>

            {/* BIM Angle Tab */}
            <TabsContent value="angle" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="bimAngle" className="text-sm font-medium">
                  L'Angle BIMsmarter (Pragmatisme)
                </Label>
                <Textarea
                  id="bimAngle"
                  placeholder='Traduis la théorie en pratique pour le Luxembourg (GID) ou la Belgique (DIU/PME). Donne un conseil "Quick Win" applicable demain matin.'
                  value={articleData.bimAngle}
                  onChange={(e) => handleChange("bimAngle", e.target.value)}
                  className="min-h-[150px] bg-input/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conclusion" className="text-sm font-medium">
                  Conclusion & CTA
                </Label>
                <Textarea
                  id="conclusion"
                  placeholder="Invite à l'action (Audit Flash ou Contact) pour mettre en place cette solution."
                  value={articleData.conclusion}
                  onChange={(e) => handleChange("conclusion", e.target.value)}
                  className="min-h-[100px] bg-input/50 border-border focus:border-primary"
                />
              </div>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="technicalSources" className="text-sm font-medium">
                  Encadré Technique (Sources)
                </Label>
                <Textarea
                  id="technicalSources"
                  placeholder="Liste les sources exactes utilisées : Nom de la norme, Numéro du chapitre, Numéro de la Figure ou du Tableau. Ex: Source : NBN EN ISO 19650-2:2019, Chapitre 5.1.7."
                  value={articleData.technicalSources}
                  onChange={(e) => handleChange("technicalSources", e.target.value)}
                  className="min-h-[150px] bg-input/50 border-border focus:border-primary font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Normes disponibles : ISO 19650-1 à -6, prescriptions CRTI-B (Luxembourg), DIU (Belgique)
                </p>
              </div>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="altText" className="text-sm font-medium">
                  Texte Alternatif Image — {articleData.altText.length}/125 caractères
                </Label>
                <Textarea
                  id="altText"
                  placeholder="Alt Text SEO pour l'image principale. Doit contenir le mot-clé principal (ISO 19650, BIM, CDE...)"
                  value={articleData.altText}
                  onChange={(e) => handleChange("altText", e.target.value.slice(0, 125))}
                  className="min-h-[80px] bg-input/50 border-border focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 125 caractères. Ex: "Comparaison Chaos vs CDE ISO 19650 : Flux de validation BIM structuré (WIP, Partagé, Publié)."
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ArticleForm;
