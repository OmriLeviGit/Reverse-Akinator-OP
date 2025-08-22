import { useState, useEffect } from "react";
import ColorThief from "colorthief";

const backgroundConfigs = [
  { image: "/img/background/luffy.jpg" },
  { image: "/img/background/zoro.jpg" },
  { image: "/img/background/ussop.jpg" },
  { image: "/img/background/sanji.jpg" },
  { image: "/img/background/nami.jpg" },
  { image: "/img/background/chopper.jpg" },
  { image: "/img/background/robin.jpg" },
  { image: "/img/background/franky.jpg" },
  { image: "/img/background/brook.jpg" },
  { image: "/img/background/jinbe.jpg" }, // missing
];

export const useRandomBackground = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<(typeof backgroundConfigs)[0] | null>(null);

  useEffect(() => {
    const failedIndices = new Set<number>();

    // Get recently used backgrounds from localStorage
    const getRecentlyUsed = (): number[] => {
      try {
        const stored = localStorage.getItem("recentBackgrounds");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    };

    // Save successful background to localStorage
    const saveRecentBackground = (index: number) => {
      try {
        const recent = getRecentlyUsed();
        const updated = [index, ...recent.filter((i) => i !== index)].slice(0, 3); // Keep last 3, avoid duplicates
        localStorage.setItem("recentBackgrounds", JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
    };

    const tryLoadImage = () => {
      const recentlyUsed = getRecentlyUsed();

      // Get available indices (ones that haven't failed AND weren't recently used)
      const availableIndices = backgroundConfigs
        .map((_, index) => index)
        .filter((index) => !failedIndices.has(index) && !recentlyUsed.includes(index));

      // If no fresh images available, fall back to any non-failed images
      const fallbackIndices = backgroundConfigs.map((_, index) => index).filter((index) => !failedIndices.has(index));

      const indicesToUse = availableIndices.length > 0 ? availableIndices : fallbackIndices;

      // If no images left to try, give up
      if (indicesToUse.length === 0) {
        setImageLoaded(true);
        return;
      }

      // Pick random from available indices
      const randomIndex = indicesToUse[Math.floor(Math.random() * indicesToUse.length)];
      const randomConfig = backgroundConfigs[randomIndex];
      setSelectedConfig(randomConfig);

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = randomConfig.image;

      img.onload = () => {
        const colorThief = new ColorThief();
        const [r, g, b] = colorThief.getColor(img);
        const hsl = rgbToHsl(r, g, b);
        const root = document.documentElement;
        root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);

        // Apply background to document body, positioned to start after header
        document.body.style.backgroundImage = `url(${randomConfig.image})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center top 70px";
        document.body.style.backgroundAttachment = "scroll";
        document.body.style.backgroundRepeat = "no-repeat";

        // Save this successful background
        saveRecentBackground(randomIndex);
        setImageLoaded(true);
      };

      img.onerror = () => {
        // Mark this index as failed and try again
        failedIndices.add(randomIndex);
        tryLoadImage();
      };
    };

    tryLoadImage();
  }, []);

  if (!imageLoaded) {
    return {
      isLoading: true,
      LoadingComponent: (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#000",
            color: "white",
          }}
        >
          Loading...
        </div>
      ),
    };
  }

  return {
    isLoading: false,
    selectedBackground: selectedConfig?.image || "",
    selectedConfig,
  };
};

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
