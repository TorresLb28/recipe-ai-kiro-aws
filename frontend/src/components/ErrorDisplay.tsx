import { useState, useEffect } from 'react';

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds for non-critical errors
    // Critical errors (network, 500) stay visible for user dismissal
    const isCriticalError = 
      error.includes('Cannot connect') || 
      error.includes('timed out') ||
      error.includes('Unable to generate');

    if (!isCriticalError) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error, onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="error-container" role="alert" aria-live="assertive">
      <p>{error}</p>
      <button 
        onClick={() => {
          setIsVisible(false);
          onDismiss();
        }}
        className="error-dismiss-button"
      >
        Dismiss
      </button>
    </div>
  );
}
