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
    
    // Get recently used images from localStorage (last 3 selections)
    const getRecentlyUsed = (): number[] => {
      try {
        const recent = localStorage.getItem('recentBackgrounds');
        return recent ? JSON.parse(recent) : [];
      } catch {
        return [];
      }
    };

    // Save current selection to localStorage
    const saveRecentlyUsed = (index: number) => {
      try {
        const recent = getRecentlyUsed();
        const updated = [index, ...recent.filter(i => i !== index)].slice(0, 3);
        localStorage.setItem('recentBackgrounds', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
    };

    const tryLoadImage = () => {
      const recentlyUsed = getRecentlyUsed();
      
      // Get available indices (ones that haven't failed and aren't recently used)
      let availableIndices = backgroundConfigs
        .map((_, index) => index)
        .filter((index) => !failedIndices.has(index) && !recentlyUsed.includes(index));

      // If no images left after avoiding recent ones, allow recent images (except failed ones)
      if (availableIndices.length === 0) {
        availableIndices = backgroundConfigs
          .map((_, index) => index)
          .filter((index) => !failedIndices.has(index));
      }

      // If still no images left to try, give up
      if (availableIndices.length === 0) {
        setImageLoaded(true);
        return;
      }

      // Pick random from available indices
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
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
        saveRecentlyUsed(randomIndex);
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
