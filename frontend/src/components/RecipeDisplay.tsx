import { RecipeResponse } from '../api/apiClient';

interface RecipeDisplayProps {
  recipe: RecipeResponse;
}

export function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  // Format cooking time: minutes if <60, hours+minutes if >=60 (REQ-3.5)
  const formatCookingTime = (minutes?: number): string => {
    if (!minutes) return 'Not specified';
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  };

  // Separate ingredients by category (REQ-3.3)
  const youHaveIngredients = recipe.ingredients.filter(ing => ing.category === 'you-have');
  const youMayNeedIngredients = recipe.ingredients.filter(ing => ing.category === 'you-may-need');

  return (
    <div className="recipe-container">
      {/* Recipe title and description (REQ-3.1, REQ-3.2) */}
      <h2 className="recipe-title">{recipe.title}</h2>
      
      {recipe.description && (
        <p className="recipe-description">{recipe.description}</p>
      )}

      {/* Cooking time and servings metadata (REQ-3.5, REQ-3.6) */}
      <div className="recipe-meta">
        <div className="recipe-meta-item">
          <span className="recipe-meta-label">Cooking Time</span>
          <span className="recipe-meta-value">{formatCookingTime(recipe.cookingTime)}</span>
        </div>
        <div className="recipe-meta-item">
          <span className="recipe-meta-label">Servings</span>
          <span className="recipe-meta-value">{recipe.servings || 'Not specified'}</span>
        </div>
      </div>

      {/* Ingredients section with visual distinction by category (REQ-3.3) */}
      <div className="recipe-section">
        <h3>Ingredients</h3>
        
        {youHaveIngredients.length > 0 && (
          <div className="ingredients-category">
            <h4 className="ingredients-category-label">✓ You Have</h4>
            <ul className="ingredients-list">
              {youHaveIngredients.map((ing, idx) => (
                <li key={idx} className="ingredients-list you-have">
                  {ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {youMayNeedIngredients.length > 0 && (
          <div className="ingredients-category">
            <h4 className="ingredients-category-label">+ You May Need</h4>
            <ul className="ingredients-list">
              {youMayNeedIngredients.map((ing, idx) => (
                <li key={idx} className="ingredients-list you-may-need">
                  {ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cooking steps in sequential order (REQ-3.4) */}
      <div className="recipe-section">
        <h3>Steps</h3>
        <ol className="steps-list">
          {recipe.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
