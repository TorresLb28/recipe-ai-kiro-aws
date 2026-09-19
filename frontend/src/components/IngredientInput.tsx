import { useState } from 'react';

interface IngredientInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled: boolean;
}

export function IngredientInput({
  value,
  onChange,
  onSubmit,
  disabled
}: IngredientInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = () => {
    // Client-side validation (REQ-1.2, REQ-1.3)
    if (!value || value.trim().length === 0) {
      setError('Please enter ingredients before generating a recipe');
      return;
    }

    if (value.length > 2000) {
      setError('Ingredient list is too long. Please limit to 2000 characters.');
      return;
    }

    setError(null);
    onSubmit(value);
  };

  const remainingChars = 2000 - value.length;
  const isNearLimit = remainingChars < 200;

  return (
    <div className="ingredient-input-container">
      <label htmlFor="ingredients-input" className="ingredient-label">
        <h2>Enter Your Ingredients</h2>
        <p>List the ingredients you have available, separated by commas or on separate lines.</p>
      </label>

      <textarea
        id="ingredients-input"
        className="ingredient-textarea"
        placeholder="e.g., chicken breast, rice, broccoli, garlic, soy sauce"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        rows={5}
        aria-label="Ingredient list input"
        aria-describedby="character-count"
      />

      <div 
        id="character-count" 
        className={`character-count ${isNearLimit ? 'warning' : ''}`}
        role="status"
        aria-live="polite"
      >
        {remainingChars} characters remaining
      </div>

      {error && (
        <div className="input-error" role="alert">
          {error}
        </div>
      )}

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={disabled || value.trim().length === 0}
        aria-busy={disabled}
      >
        {disabled ? 'Generating...' : 'Generate Recipe'}
      </button>
    </div>
  );
}
