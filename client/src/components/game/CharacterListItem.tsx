import React from "react";
import { BasicCharacter } from "@/types";
import { CharacterImage } from "../CharacterImage";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useDebounce } from "@/hooks/useDebounce";

interface CharacterListItemProps {
  character: BasicCharacter;
  onSelect: (characterName: string) => void;
  disabled?: boolean;
}

export const CharacterListItem = ({ character, onSelect, disabled = false }: CharacterListItemProps) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [previewPosition, setPreviewPosition] = React.useState({ x: 0, y: 0 });
  const [forceHide, setForceHide] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

  const debouncedHovering = useDebounce(isHovering, 500);
  const showPreview = debouncedHovering && !forceHide;

  const handleClick = () => {
    if (!disabled) {
      onSelect(character.name);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (character.wikiLink) {
      window.open(character.wikiLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isMouseActuallyOver =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (isMouseActuallyOver) {
      // Clear any hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Set position for preview
      setPreviewPosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
      });

      // Start hovering (debounce will handle the delay)
      setIsHovering(true);
      setForceHide(false);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Small delay to allow moving to preview content
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
      setForceHide(true);
    }, 200);
  };

  const handlePreviewMouseEnter = () => {
    // Clear timeout and keep hovering when mouse enters preview
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsHovering(true);
    setForceHide(false);
  };

  const handlePreviewMouseLeave = () => {
    setIsHovering(false);
    setForceHide(true);
  };

  // Close preview on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setIsHovering(false);
      setForceHide(true);
    };

    const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        className={`transition-all duration-200 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CharacterImage character={character} size="small" />
      </div>

      {showPreview && (
        <div
          className="fixed z-50 pointer-events-auto -translate-y-1/2"
          style={{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        >
          <div className="p-0 w-auto border shadow-xl rounded-lg overflow-hidden bg-popover border-border">
            {character.wikiLink ? (
              <a
                href={character.wikiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative rounded-lg overflow-hidden no-underline hover:opacity-90 transition-opacity"
                onClick={handlePreviewClick}
              >
                <CharacterImage character={character} size="medium" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm px-2 py-1 rounded-b-lg">
                  <p className="text-sm font-semibold text-white text-center break-words [text-shadow:_0_0_1px_black,_0_0_1px_black]">
                    {character.name}
                  </p>
                </div>
              </a>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                <CharacterImage character={character} size="medium" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm px-2 py-1 rounded-b-lg">
                  <p className="text-sm font-semibold text-white text-center break-words [text-shadow:_0_0_1px_black,_0_0_1px_black]">
                    {character.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
