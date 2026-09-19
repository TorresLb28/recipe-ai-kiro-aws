interface RegenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function RegenerateButton({ onClick, disabled }: RegenerateButtonProps) {
  return (
    <button
      className="regenerate-button secondary"
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled}
    >
      {disabled ? 'Generating...' : '✨ Generate Different Recipe'}
    </button>
  );
}
