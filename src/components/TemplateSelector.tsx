import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GitCompare, AlertTriangle, Building, FileText, GraduationCap } from "lucide-react";

export type ArticleTemplate = "standard" | "tutorial" | "comparison" | "mistakes" | "casestudy" | "norm";

interface TemplateSelectorProps {
  selectedTemplate: ArticleTemplate;
  onSelectTemplate: (template: ArticleTemplate) => void;
}

const templates: { id: ArticleTemplate; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Article classique Problème → Solution",
    icon: FileText,
  },
  {
    id: "tutorial",
    label: "Tutoriel",
    description: "Guide étape par étape",
    icon: GraduationCap,
  },
  {
    id: "comparison",
    label: "Comparatif",
    description: "X vs Y : lequel choisir ?",
    icon: GitCompare,
  },
  {
    id: "mistakes",
    label: "Erreurs",
    description: "X erreurs courantes à éviter",
    icon: AlertTriangle,
  },
  {
    id: "casestudy",
    label: "Étude de cas",
    description: "Retour d'expérience concret",
    icon: Building,
  },
  {
    id: "norm",
    label: "Décryptage",
    description: "Vulgarisation d'une norme",
    icon: BookOpen,
  },
];

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-primary">
          <BookOpen className="h-4 w-4" />
          Template d'Article
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            return (
              <Button
                key={template.id}
                variant="outline"
                className={`h-auto py-2 px-3 flex flex-col items-start gap-1 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50"
                }`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-medium text-xs">{template.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground text-left leading-tight">
                  {template.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;
