import React, { useState } from 'react';

export const TestGame: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  
  const handleClick = () => {
    console.log('🎯 Test button clicked!', clickCount + 1);
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Game Component</h1>
      
      <div className="space-y-4">
        <button 
          onClick={handleClick}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🎯 Click Test ({clickCount})
        </button>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <p>If you can see this and click the button, React is working fine.</p>
          <p>Click count: {clickCount}</p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>This is a minimal test to isolate the click issue.</p>
          <p>Check console for click logs.</p>
        </div>
      </div>
    </div>
  );
};