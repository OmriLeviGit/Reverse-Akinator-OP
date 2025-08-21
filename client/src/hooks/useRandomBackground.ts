// hooks/useRandomBackground.ts
import { useState, useEffect } from "react";

const backgroundConfigs = [
  {
    image: "/img/background/bg1.png",
    primary: "250 80% 60%", // Purple-blue (your current primary)
  },
  //   {
  //     image: "/img/background/bg1.png",
  //     primary: "15 95% 55%", // Orange-red
  //   },
  //   {
  //     image: "/img/background/bg1.png",
  //     primary: "120 70% 50%", // Green
  //   },
];

export const useRandomBackground = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<(typeof backgroundConfigs)[0] | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgroundConfigs.length);
    const randomConfig = backgroundConfigs[randomIndex];
    setSelectedConfig(randomConfig);
    console.log("Selected config:", randomConfig);

    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty("--primary", randomConfig.primary);
    // root.style.setProperty("--primary-hover", randomConfig.primaryHover);
    // root.style.setProperty("--primary-muted", randomConfig.primaryMuted);

    const img = new Image();
    img.onload = () => {
      console.log("Image loaded successfully!");
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.log("Image failed to load!");
      setImageLoaded(true);
    };
    img.src = randomConfig.image;
  }, []);

  return {
    imageLoaded,
    selectedBackground: selectedConfig?.image || "",
    selectedConfig,
  };
};
