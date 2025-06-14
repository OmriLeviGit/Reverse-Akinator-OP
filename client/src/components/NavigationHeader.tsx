
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const NavigationHeader: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/character-management', label: 'Character Management' }
  ];

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-1 py-4">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                className={`${
                  location.pathname === item.path
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                } transition-all duration-200`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;
