export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 w-[${value}%]`}
      />
    </div>
  );
}