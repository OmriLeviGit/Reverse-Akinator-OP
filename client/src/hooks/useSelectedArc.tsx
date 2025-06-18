// hooks/useSelectedArc.ts
import { useState, useEffect } from 'react';

interface UseSelectedArcReturn {
  selectedArc: string;
  setSelectedArc: (arc: string) => void;
  clearSelectedArc: () => void;
}

export const useSelectedArc = (): UseSelectedArcReturn => {
  const [selectedArc, setSelectedArc] = useState<string>(() => {
    // Initialize from localStorage on first load
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedArc') || '';
    }
    return '';
  });

  // Save to localStorage whenever selectedArc changes
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedArc) {
      localStorage.setItem('selectedArc', selectedArc);
    }
  }, [selectedArc]);

  // Helper function to clear the selection
  const clearSelectedArc = (): void => {
    setSelectedArc('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedArc');
    }
  };

  return {
    selectedArc,
    setSelectedArc,
    clearSelectedArc
  };
};