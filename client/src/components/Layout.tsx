import React from "react";
import Navigation from "./Navigation";
import { Arc } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
  backgroundImage: string;
  // Navigation props
  globalArcLimit: string;
  onMaxArcChange: (arcName: string) => void;
  availableArcs: Arc[];
}

const Layout = ({ children, backgroundImage, globalArcLimit, onMaxArcChange, availableArcs }: LayoutProps) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="sticky top-0 z-50 flex-shrink-0">
        <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={onMaxArcChange} availableArcs={availableArcs} />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundAttachment: "scroll",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative h-full bg-background/80 overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
