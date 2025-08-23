// components/GlobalSpoilerModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "../contexts/AppContext";

const GlobalSpoilerModal = () => {
  const { availableArcs, updateGlobalArcLimit, isLoading, sessionData } = useAppContext();
  const [showSpoilerModal, setShowSpoilerModal] = useState<boolean>(false);
  const [selectedGlobalArcName, setSelectedGlobalArcName] = useState<string>("All");

  const isAppReady = !isLoading && sessionData && availableArcs.length > 0;

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore");

    if (!hasVisited && isAppReady) {
      const timer = setTimeout(() => {
        setShowSpoilerModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  const handleContinue = () => {
    updateGlobalArcLimit(selectedGlobalArcName);
    setShowSpoilerModal(false);
    localStorage.setItem("hasVisitedBefore", "true");
  };

  return (
    <Dialog open={showSpoilerModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-2xl font-bold text-foreground">Spoiler Protection Setup</DialogTitle>
          <DialogDescription className="text-muted-foreground text-base leading-relaxed">
            What's the latest story arc you've seen or read? This will attempt to prevent spoilers from later content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Maximum Arc Seen</label>
            <Select value={selectedGlobalArcName} onValueChange={setSelectedGlobalArcName}>
              <SelectTrigger className="bg-input hover:bg-input border-border text-foreground">
                <SelectValue placeholder="Select an arc" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="All" className="text-popover-foreground hover:bg-secondary">
                  All Arcs
                </SelectItem>
                {[...availableArcs].reverse().map((arc) => (
                  <SelectItem key={arc.name} value={arc.name} className="text-popover-foreground hover:bg-secondary">
                    {arc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSpoilerModal;
