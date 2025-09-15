import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { StatBadge } from "./StatBadge"

export interface DayGroupCardProps extends React.HTMLAttributes<HTMLDivElement> {
  dateLabel: string
  entryCount: number
  avgLabel?: string
  children?: React.ReactNode
}

const DayGroupCard = React.forwardRef<HTMLDivElement, DayGroupCardProps>(
  ({ className, dateLabel, entryCount, avgLabel, children, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("insights-card", className)} {...props}>
        <CardContent className="p-4 md:p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-section font-semibold truncate">
                {dateLabel}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatBadge size="sm" colorScheme="neutral">
                {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
              </StatBadge>
              
              {avgLabel && (
                <StatBadge size="sm" colorScheme="accent">
                  {avgLabel}
                </StatBadge>
              )}
            </div>
          </div>
          
          {/* Slot for rows */}
          {children && (
            <div className="space-y-2">
              {children}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
DayGroupCard.displayName = "DayGroupCard"

export { DayGroupCard }