import React from 'react';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-secondary mb-3"></div>
      {message && <p className="text-gray-500 text-xs font-bold animate-pulse">{message}</p>}
    </div>
  );
};

export default Spinner;