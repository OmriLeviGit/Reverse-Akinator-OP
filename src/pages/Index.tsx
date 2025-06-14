import React, { useState } from 'react';
import Header from '../components/Header';
import NavigationHeader from '../components/NavigationHeader';
import ArcSelection from '../components/ArcSelection';
import FillerSettings from '../components/FillerSettings';
import DifficultySelection from '../components/DifficultySelection';
import StartButton from '../components/StartButton';
import GameScreen from '../components/GameScreen';
import CharacterRevealScreen from '../components/CharacterRevealScreen';
import { useGameContext } from '../contexts/GameContext';

type GameState = 'home' | 'playing' | 'reveal';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('home');
  const [selectedArc, setSelectedArc] = useState('all');
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');

  const { setCurrentCharacter, getAvailableCharacters } = useGameContext();

  const handleFillerPercentageChange = (value: number[]) => {
    const newValue = value[0];
    setFillerPercentage(newValue);
    
    // Disable non-TV fillers checkbox when slider is at 0
    if (newValue === 0) {
      setIncludeNonTVFillers(false);
    }
  };

  const handleStart = () => {
    console.log('Starting game with settings:', {
      selectedArc,
      fillerPercentage,
      includeNonTVFillers,
      selectedDifficulty
    });

    // Get available characters based on difficulty and ignore list
    const availableCharacters = getAvailableCharacters(selectedDifficulty);
    
    if (availableCharacters.length === 0) {
      alert("No characters available for this difficulty level");
      return;
    }

    // Select a random character from available ones
    const randomCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    setCurrentCharacter(randomCharacter);
    
    setGameState('playing');
  };

  const handleRevealCharacter = () => {
    setGameState('reveal');
  };

  const handlePlayAgain = () => {
    // Get available characters for new game
    const availableCharacters = getAvailableCharacters(selectedDifficulty);
    
    if (availableCharacters.length === 0) {
      alert("No characters available for this difficulty level");
      setGameState('home');
      return;
    }

    // Select a new random character
    const randomCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    setCurrentCharacter(randomCharacter);
    setGameState('playing');
  };

  const handleReturnHome = () => {
    setGameState('home');
  };

  // Render different screens based on game state
  if (gameState === 'playing') {
    return (
      <GameScreen 
        onRevealCharacter={handleRevealCharacter}
        onReturnHome={handleReturnHome}
      />
    );
  }

  if (gameState === 'reveal') {
    return (
      <CharacterRevealScreen 
        onPlayAgain={handlePlayAgain}
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Home screen
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background without Animation */}
      <div className="absolute inset-0 ocean-gradient"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <NavigationHeader />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Settings Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
              <div className="space-y-8">
                <div className="transform transition-all duration-300">
                  <DifficultySelection
                    selectedDifficulty={selectedDifficulty}
                    onDifficultyChange={setSelectedDifficulty}
                  />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <ArcSelection 
                    selectedArc={selectedArc}
                    onArcChange={setSelectedArc}
                  />
                </div>
                
                <div className="border-t border-white/20 pt-6">
                  <FillerSettings
                    fillerPercentage={fillerPercentage}
                    onFillerPercentageChange={handleFillerPercentageChange}
                    includeNonTVFillers={includeNonTVFillers}
                    onIncludeNonTVFillersChange={setIncludeNonTVFillers}
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-8 flex justify-center">
              <StartButton onStart={handleStart} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
