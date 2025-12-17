import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ArticleData } from "./ArticleForm";

interface ExportActionsProps {
  articleData: ArticleData;
  onReset: () => void;
}

const ExportActions = ({ articleData, onReset }: ExportActionsProps) => {
  const generateMarkdown = () => {
    let md = "";

    // Meta section
    md += `## 1. LES MÉTA-DONNÉES DU POST\n\n`;
    if (articleData.title) md += `**Post Title (H1):** ${articleData.title}\n\n`;
    if (articleData.description) md += `**Post Description (SEO):** ${articleData.description}\n\n`;
    if (articleData.slug) md += `**Post URL (Slug):** ${articleData.slug}\n\n`;

    // Content section
    md += `---\n\n## 2. LE CONTENU DU POST\n\n`;
    if (articleData.introduction) {
      md += `### Introduction (Le Hook)\n\n${articleData.introduction}\n\n`;
    }
    if (articleData.problem) {
      md += `### Le Problème (Agitation)\n\n${articleData.problem}\n\n`;
    }
    if (articleData.solution) {
      md += `### La Solution Normative (L'Autorité)\n\n${articleData.solution}\n\n`;
    }
    if (articleData.bimAngle) {
      md += `### L'Angle BIMsmarter (Pragmatisme)\n\n${articleData.bimAngle}\n\n`;
    }
    if (articleData.conclusion) {
      md += `### Conclusion & CTA\n\n${articleData.conclusion}\n\n`;
    }

    // Technical section
    if (articleData.technicalSources) {
      md += `---\n\n## 3. ENCADRÉ TECHNIQUE POUR LES GEEKS\n\n`;
      md += `\`\`\`\n${articleData.technicalSources}\n\`\`\`\n\n`;
    }

    // Alt text
    if (articleData.altText) {
      md += `---\n\n## 4. TEXTE ALTERNATIF IMAGE\n\n`;
      md += `*${articleData.altText}*\n`;
    }

    return md;
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Article copié en Markdown !");
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `article-bimsmarter${articleData.slug || "-draft"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Article téléchargé !");
  };

  const handleCopyHTML = async () => {
    let html = "";
    
    if (articleData.title) {
      html += `<h1>${articleData.title}</h1>\n\n`;
    }
    
    if (articleData.introduction) {
      html += `<p class="intro">${articleData.introduction.replace(/\n/g, '<br>')}</p>\n\n`;
    }
    
    if (articleData.problem) {
      html += `<h2>Le Problème</h2>\n<div>${articleData.problem.replace(/\n/g, '<br>')}</div>\n\n`;
    }
    
    if (articleData.solution) {
      html += `<h2>La Solution Normative</h2>\n<div>${articleData.solution.replace(/\n/g, '<br>')}</div>\n\n`;
    }
    
    if (articleData.bimAngle) {
      html += `<h2>L'Angle BIMsmarter</h2>\n<div>${articleData.bimAngle.replace(/\n/g, '<br>')}</div>\n\n`;
    }
    
    if (articleData.conclusion) {
      html += `<h2>Conclusion</h2>\n<div>${articleData.conclusion.replace(/\n/g, '<br>')}</div>\n\n`;
    }
    
    if (articleData.technicalSources) {
      html += `<aside class="technical-box">\n<h3>Encadré Technique</h3>\n<pre>${articleData.technicalSources}</pre>\n</aside>\n`;
    }

    try {
      await navigator.clipboard.writeText(html);
      toast.success("Article copié en HTML !");
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  const hasContent = articleData.title || articleData.introduction || articleData.problem;

  return (
    <Card className="glass-panel border-primary/20">
      <CardContent className="flex flex-wrap items-center gap-2 p-4">
        <Button
          variant="outline"
          onClick={handleCopyMarkdown}
          disabled={!hasContent}
          className="border-primary/30 hover-bim-cyan min-h-[44px] flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copier Markdown
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadMarkdown}
          disabled={!hasContent}
          className="border-primary/30 hover-bim-cyan min-h-[44px] flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger .md
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyHTML}
          disabled={!hasContent}
          className="border-primary/30 hover-bim-cyan min-h-[44px] flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Copier HTML
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground hover:text-destructive min-h-[44px] flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
