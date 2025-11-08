import { cn } from "@/lib/utils";
import React from "react";

export function DotBackgroundDemo({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white dark:bg-black">
      {/* Dotted grid */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:30px_50px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />

      {/* Radial fade mask */}
      <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}