import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Arc } from "@/types";

interface NavigationProps {
  maxArcSeen: string;
  onMaxArcChange: (arcName: string) => void;
  availableArcs: Arc[];
}

const Navigation = ({ maxArcSeen, onMaxArcChange, availableArcs }: NavigationProps) => {
  const location = useLocation();

  // Display "All Arcs" instead of "All"
  const getDisplayText = (arcName: string) => {
    return arcName === "All" ? "All" : arcName;
  };

  return (
    <nav className="w-full border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/">
              <Button
                variant="ghost"
                className={`${
                  location.pathname === "/"
                    ? "text-foreground hover:text-primary hover:bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Home
              </Button>
            </Link>
            <Link to="/character-management">
              <Button
                variant="ghost"
                className={`${
                  location.pathname === "/character-management"
                    ? "text-foreground hover:text-primary hover:bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Character Management
              </Button>
            </Link>
          </div>

          {/* Right side spoiler protection */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-secondary hover:bg-secondary-hover text-secondary-foreground hover:text-secondary-foreground-hover border border-border transition-all duration-200"
                >
                  Max Arc Seen: {getDisplayText(maxArcSeen)}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border max-h-60 overflow-y-auto">
                {/* "All Arcs" option first */}
                <DropdownMenuItem
                  onClick={() => onMaxArcChange("All")}
                  className="cursor-pointer hover:bg-secondary text-popover-foreground"
                >
                  All Arcs
                </DropdownMenuItem>
                {/* Then available arcs in reverse order */}
                {[...availableArcs].reverse().map((arc) => (
                  <DropdownMenuItem
                    key={arc.name}
                    onClick={() => onMaxArcChange(arc.name)}
                    className="cursor-pointer hover:bg-secondary text-popover-foreground"
                  >
                    {arc.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
