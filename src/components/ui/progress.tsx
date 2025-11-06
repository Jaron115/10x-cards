import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number;
}

/**
 * Progress bar component with smooth animation
 * Displays a progress bar with a given value (0-100)
 */
function Progress({ value = 0, className, ...props }: ProgressProps) {
  return (
    <div
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <motion.div
        className="h-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      />
    </div>
  );
}

export { Progress };
