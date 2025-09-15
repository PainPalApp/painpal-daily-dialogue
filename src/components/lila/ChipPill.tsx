import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipPillVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[12px] leading-tight sm:text-xs transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        outlined: "border border-border bg-background text-foreground",
      },
      colorScheme: {
        neutral: "bg-muted text-muted-foreground",
        accent: "bg-primary/10 text-primary",
        warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        good: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        bad: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      }
    },
    defaultVariants: {
      variant: "default",
      colorScheme: "neutral",
    },
  }
)

export interface ChipPillProps 
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipPillVariants> {}

const ChipPill = React.forwardRef<HTMLSpanElement, ChipPillProps>(
  ({ className, variant, colorScheme, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipPillVariants({ variant, colorScheme }), className)}
        {...props}
      />
    )
  }
)
ChipPill.displayName = "ChipPill"

export { ChipPill, chipPillVariants }