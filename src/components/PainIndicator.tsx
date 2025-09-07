interface PainIndicatorProps {
  painLevel: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PainIndicator = ({ painLevel, size = 'sm', className = '' }: PainIndicatorProps) => {
  const getSeverityClass = (level: number) => {
    if (level >= 7) return 'pain-indicator-severe';
    if (level >= 4) return 'pain-indicator-moderate';
    return 'pain-indicator-mild';
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'lg': return 'w-6 h-6 text-sm';
      case 'md': return 'w-5 h-5 text-xs';
      default: return 'w-4 h-4 text-xs';
    }
  };

  return (
    <div className="pain-indicator-container">
      <div className={`pain-indicator ${getSeverityClass(painLevel)} ${getSizeClass(size)} ${className}`}>
        {painLevel}
      </div>
    </div>
  );
};