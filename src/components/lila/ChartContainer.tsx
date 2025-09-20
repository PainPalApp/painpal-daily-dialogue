import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  minHeightSm?: number
  minHeightMd?: number
  minHeightLg?: number
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ 
    className, 
    minHeightSm = 120, 
    minHeightMd = 160, 
    minHeightLg = 200,
    children,
    ...props 
  }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(0)

    // Combine refs
    React.useImperativeHandle(ref, () => containerRef.current!, [])

    React.useEffect(() => {
      const element = containerRef.current
      if (!element) return

      const updateWidth = () => {
        setWidth(element.offsetWidth)
      }

      // Try ResizeObserver first
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setWidth(entry.contentRect.width)
          }
        })

        resizeObserver.observe(element)
        
        // Initial measurement
        updateWidth()

        return () => {
          resizeObserver.disconnect()
        }
      } else {
        // Fallback to window resize
        const handleResize = () => {
          updateWidth()
        }

        window.addEventListener('resize', handleResize)
        
        // Initial measurement
        updateWidth()

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      }
    }, [])

    const heightClasses = cn(
      `h-[${minHeightSm}px]`,
      `md:h-[${minHeightMd}px]`,
      `lg:h-[${minHeightLg}px]`
    )

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full",
          heightClasses,
          className
        )}
        {...props}
      >
        {width > 0 ? (
          children
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-8 rounded-sm" />
          </div>
        )}
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

export { ChartContainer }