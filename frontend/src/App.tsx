import { useState } from 'react';
import './styles/App.css';
import { IngredientInput } from './components/IngredientInput';
import { RecipeDisplay } from './components/RecipeDisplay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { RegenerateButton } from './components/RegenerateButton';
import { RecipeResponse } from './api/apiClient';
import { generateRecipe } from './api/apiClient';

interface AppState {
  ingredientInput: string;
  recipe: RecipeResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function App() {
  const [state, setState] = useState<AppState>({
    ingredientInput: '',
    recipe: null,
    isLoading: false,
    error: null
  });

  const handleSubmit = async (ingredients: string) => {
    // Validate input
    if (!ingredients || ingredients.trim().length === 0) {
      setState(prev => ({
        ...prev,
        error: 'Please enter ingredients before generating a recipe'
      }));
      return;
    }

    if (ingredients.length > 2000) {
      setState(prev => ({
        ...prev,
        error: 'Ingredient list is too long. Please limit to 2000 characters.'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const recipe = await generateRecipe({
        ingredients,
        regenerate: false
      });

      setState(prev => ({
        ...prev,
        recipe,
        error: null,
        isLoading: false,
        ingredientInput: ingredients
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        isLoading: false,
        recipe: null
      }));
    }
  };

  const handleRegenerate = async () => {
    if (!state.ingredientInput) {
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const recipe = await generateRecipe({
        ingredients: state.ingredientInput,
        regenerate: true
      });

      setState(prev => ({
        ...prev,
        recipe,
        error: null,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        isLoading: false
      }));
    }
  };

  const handleErrorDismiss = () => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Recipe AI Generator</h1>
        <p>Enter your ingredients and let AI create a delicious recipe</p>
      </header>

      <main className="app-main">
        <IngredientInput
          value={state.ingredientInput}
          onChange={(value) => setState(prev => ({ ...prev, ingredientInput: value }))}
          onSubmit={handleSubmit}
          disabled={state.isLoading}
        />

        {state.isLoading && <LoadingSpinner />}

        {state.error && (
          <ErrorDisplay
            error={state.error}
            onDismiss={handleErrorDismiss}
          />
        )}

        {state.recipe && (
          <>
            <RecipeDisplay recipe={state.recipe} />
            <RegenerateButton
              onClick={handleRegenerate}
              disabled={state.isLoading}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Recipe AI Generator. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
