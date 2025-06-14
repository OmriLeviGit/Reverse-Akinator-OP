
import React, { useState } from 'react';
import Header from '../components/Header';
import ArcSelection from '../components/ArcSelection';
import FillerSettings from '../components/FillerSettings';
import StartButton from '../components/StartButton';

const Index = () => {
  const [selectedArc, setSelectedArc] = useState('all');
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);

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
      includeNonTVFillers
    });
    // Game start logic will be added later
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background with Animated Waves */}
      <div className="absolute inset-0 ocean-gradient">
        <div className="absolute inset-0">
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Settings Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
              <div className="space-y-8">
                <ArcSelection 
                  selectedArc={selectedArc}
                  onArcChange={setSelectedArc}
                />
                
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

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-white/70 text-sm">
            Set sail on your One Piece adventure!
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
