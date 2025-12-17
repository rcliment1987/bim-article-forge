import { Moon, Sun, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import bimLogo from "@/assets/bimsmarter-logo.jpg";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const Header = ({ isDark, onToggleTheme }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-primary/20 glass-panel px-4 md:px-6">
      <div className="flex items-center gap-3">
        <a 
          href="https://bimsmarter.eu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img 
            src={bimLogo} 
            alt="BIMsmarter Logo" 
            className="h-8 md:h-10 w-auto"
          />
        </a>
        <div className="hidden md:flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Articles Creator</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="border border-primary/30 hover-bim-cyan min-h-[44px] min-w-[44px]"
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        <a
          href="https://bimsmarter.eu"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="border-primary/30 hover-bim-cyan min-h-[44px] hidden sm:flex items-center gap-2"
          >
            <span>Visiter le site</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </header>
  );
};

export default Header;
