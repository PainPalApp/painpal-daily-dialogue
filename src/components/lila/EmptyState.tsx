import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 space-y-4",
          "min-h-[200px]",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        
        <div className="space-y-2 max-w-sm">
          <h3 className="text-section font-semibold">
            {title}
          </h3>
          
          {description && (
            <p className="text-body text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2">
            {actions}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }