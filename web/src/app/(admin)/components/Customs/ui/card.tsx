export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl ${className}`} {...props} />;
}
export function CardHeader({ ...props }) { return <div className="p-6 pb-3" {...props} />; }
export function CardContent({ ...props }) { return <div className="p-6 pt-0" {...props} />; }
export function CardTitle({ ...props }) { return <h3 className="text-lg font-semibold" {...props} />; }
export function CardDescription({ ...props }) { return <p className="text-sm text-gray-500" {...props} />; }