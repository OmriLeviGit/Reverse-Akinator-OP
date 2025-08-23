import React from "react";
import Navigation from "./Navigation";
import { Arc } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
  // Navigation props
  globalArcLimit: string;
  onMaxArcChange: (arcName: string) => void;
  availableArcs: Arc[];
}

const Layout = ({ children, globalArcLimit, onMaxArcChange, availableArcs }: LayoutProps) => {
  return (
    <div className="h-screen grid grid-rows-[auto_1fr]">
      <div className="sticky top-0 z-50">
        <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={onMaxArcChange} availableArcs={availableArcs} />
      </div>

      <div className="bg-background/90">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
