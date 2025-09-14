import * as React from "react"
import { Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChipPill } from "./ChipPill"

export interface EntryRowProps extends React.HTMLAttributes<HTMLDivElement> {
  time: string
  painChip: React.ReactNode
  meta?: React.ReactNode
  onEdit?: () => void
}

const EntryRow = React.forwardRef<HTMLDivElement, EntryRowProps>(
  ({ className, time, painChip, meta, onEdit, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-[minmax(56px,72px)_1fr_44px] gap-3 items-start",
          "min-h-[56px] py-2",
          className
        )}
        {...props}
      >
        {/* Time + Pain Chip Column */}
        <div className="space-y-1">
          <div className="text-body font-medium">
            {time}
          </div>
          <div className="flex flex-wrap gap-1">
            {painChip}
          </div>
        </div>

        {/* Meta Column */}
        <div className="min-w-0">
          {meta && (
            <div className="flex flex-wrap gap-1 text-body text-muted-foreground">
              {meta}
            </div>
          )}
        </div>

        {/* Edit Button Column */}
        <div className="flex justify-end">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-11 w-11 hover:bg-muted"
              aria-label="Edit entry"
            >
              <Edit className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)
EntryRow.displayName = "EntryRow"

export { EntryRow }