
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    console.log('Logo clicked - navigate to home');
    navigate('/');
  };

  return (
    <header className="relative z-10 py-8">
      <div className="container mx-auto px-4">
        <button 
          onClick={handleLogoClick}
          className="block mx-auto transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-50 rounded-lg select-none"
        >
          <h1 className="text-6xl md:text-8xl font-black pirate-text text-center tracking-wider select-none">
            ONE PIECE
          </h1>
          <p className="text-xl md:text-2xl text-white text-center font-semibold mt-2 drop-shadow-lg select-none">
            Character Guessing Game
          </p>
        </button>
      </div>
    </header>
  );
};

export default Header;
