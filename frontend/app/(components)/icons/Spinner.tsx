type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'blue' | 'gray' | 'white';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'blue' }) => {
  const spinnerSizes: Record<SpinnerSize, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  const spinnerColors: Record<SpinnerColor, string> = {
    blue: "border-primary-gradient-start",
    gray: "border-gray-300",
    white: "border-white",
  };

  return (
    <div className={`animate-spin rounded-full border-t-2 ${spinnerSizes[size]} ${spinnerColors[color]} border-b-2 border-l-2 border-r-transparent`}></div>
  );
};

export default Spinner;