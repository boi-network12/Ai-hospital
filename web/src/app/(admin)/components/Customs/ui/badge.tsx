// components/Customs/ui/badge.tsx
type BadgeProps = {
  variant?: "default" | "destructive" | "secondary";
  className?: string;
  [key: string]: unknown;
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    secondary: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]} ${className}`}
      {...props}
    />
  );
}