import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-6 px-2.5 text-xs",
      },
      variant: {
        neutral: "bg-muted text-muted-foreground",
        good: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", 
        bad: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        accent: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "neutral",
    },
  }
)

export interface StatBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statBadgeVariants> {}

const StatBadge = React.forwardRef<HTMLSpanElement, StatBadgeProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <span
        className={cn(statBadgeVariants({ size, variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
StatBadge.displayName = "StatBadge"

export { StatBadge, statBadgeVariants }