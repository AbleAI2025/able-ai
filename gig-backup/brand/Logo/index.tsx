import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width = 50, height = 50 }) => {
  return (
    <div 
      className="text-xl font-bold text-blue-600 flex items-center justify-center"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      Able AI
    </div>
  );
};

export default Logo;
