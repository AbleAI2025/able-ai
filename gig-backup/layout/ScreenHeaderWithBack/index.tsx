import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ScreenHeaderWithBackProps {
  title?: string;
  onBack?: () => void;
  onBackClick?: () => void;
}

const ScreenHeaderWithBack: React.FC<ScreenHeaderWithBackProps> = ({ 
  title = "Back", 
  onBack,
  onBackClick 
}) => {
  const handleBack = onBack || onBackClick || (() => {});
  
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <button 
        onClick={handleBack}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
};

export default ScreenHeaderWithBack;
