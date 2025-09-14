import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-1 gap-2",
          "sm:grid-cols-[1fr_auto] sm:items-start sm:gap-4",
          actions && "sm:grid-cols-[1fr_auto]",
          className
        )}
        {...props}
      >
        <div className="space-y-1">
          <h2 className="text-section font-semibold leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-body text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }