import React from 'react';

interface GigStatusIndicatorProps {
  status?: string;
  label?: string | React.ReactElement;
  isActive?: boolean;
  isDisabled?: boolean;
}

const GigStatusIndicator: React.FC<GigStatusIndicatorProps> = ({ 
  status, 
  label, 
  isActive, 
  isDisabled 
}) => {
  const displayText = label || status || 'Unknown';
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorFromProps = () => {
    if (isDisabled) return 'bg-gray-100 text-gray-400';
    if (isActive) return 'bg-green-100 text-green-800';
    if (status) return getStatusColor(status);
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorFromProps()}`}>
      {displayText}
    </span>
  );
};

export default GigStatusIndicator;
