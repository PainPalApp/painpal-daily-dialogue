import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export interface DrawerSheetProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const DrawerSheet = React.forwardRef<HTMLDivElement, DrawerSheetProps>(
  ({ 
    children, 
    trigger, 
    title, 
    description, 
    footer, 
    open, 
    onOpenChange, 
    className,
    ...props 
  }, ref) => {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        
        <SheetContent
          ref={ref}
          side="bottom"
          className={cn(
            "h-[100dvh] w-full max-w-none rounded-none border-0",
            "sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-t-lg sm:border",
            "bg-[hsl(var(--surface))] border-[hsl(var(--border))]",
            "dark:bg-[hsl(var(--surface))] dark:border-[hsl(var(--border))]",
            "flex flex-col",
            className
          )}
          aria-describedby="drawer-desc"
          {...props}
        >
          <p id="drawer-desc" className="sr-only">{description || title || "Edit pain entry"}</p>
          {/* Header */}
          {(title || description) && (
            <SheetHeader className="text-left p-6 pb-4 border-b border-[hsl(var(--border))]">
              {title && <SheetTitle className="text-[hsl(var(--text-primary))]">{title}</SheetTitle>}
              {description && (
                <SheetDescription className="text-[hsl(var(--text-secondary))]">
                  {description}
                </SheetDescription>
              )}
            </SheetHeader>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
          
          {/* Sticky Footer */}
          {footer && (
            <div className="border-t border-[hsl(var(--border))] p-6 pt-4 bg-[hsl(var(--surface))] backdrop-blur sticky bottom-0">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }
)
DrawerSheet.displayName = "DrawerSheet"

export { DrawerSheet }