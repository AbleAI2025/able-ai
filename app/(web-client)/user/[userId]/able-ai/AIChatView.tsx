import React from 'react';
import type { Suggestion, SuggestedAction } from './AIChatContainer';

interface AIChatViewProps {
  suggestion: Suggestion | null;
  onActionClick: (action: SuggestedAction) => void;
}

const AIChatView: React.FC<AIChatViewProps> = ({ suggestion, onActionClick }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
      {suggestion ? (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">{suggestion.title}</h2>
          <p className="text-gray-300">{suggestion.description}</p>
          {suggestion.suggestedActions && suggestion.suggestedActions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <h3 className="text-md font-semibold mb-2 text-gray-400">Suggested Actions:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestion.suggestedActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => onActionClick(action)}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors duration-150 ease-in-out"
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>No active suggestion. Start a new conversation with the AI.</p>
      )}
      <div className="mt-6">
        <p>AI Chat Interface will be implemented here.</p>
      </div>
    </div>
  );
};

export default AIChatView; 