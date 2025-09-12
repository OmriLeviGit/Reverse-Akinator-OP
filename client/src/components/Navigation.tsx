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
  globalArcLimit: string;
  onMaxArcChange: (arcName: string) => void;
  availableArcs: Arc[];
}

const Navigation = ({ globalArcLimit, onMaxArcChange, availableArcs }: NavigationProps) => {
  const location = useLocation();

  // Display "All Arcs" instead of "All"
  const getDisplayText = (arcName: string) => {
    return arcName === "All" ? "All" : arcName;
  };

  return (
    <nav className="w-full bg-card shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/">
              <Button
                variant="nav"
                className={
                  location.pathname === "/"
                    ? "text-foreground hover:brightness-110 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary after:content-[''] after:opacity-100"
                    : "text-muted-foreground hover:text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary after:content-[''] after:opacity-0"
                }
              >
                Home
              </Button>
            </Link>
            <Link to="/character-management">
              <Button
                variant="nav"
                className={
                  location.pathname === "/character-management"
                    ? "text-foreground hover:brightness-110 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary after:content-[''] after:opacity-100"
                    : "text-muted-foreground hover:text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary after:content-[''] after:opacity-0"
                }
              >
                Character Management
              </Button>
            </Link>
          </div>

          {/* Right side spoiler protection */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-input hover:bg-input hover:brightness-125 border-border text-foreground px-4 py-2 rounded-md flex items-center justify-between w-auto text-sm font-medium h-10">
                Max Arc Seen: {getDisplayText(globalArcLimit)}
                <ChevronDown className="ml-4 h-4 w-4" />
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
