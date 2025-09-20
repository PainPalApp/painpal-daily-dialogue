import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface ChartContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  minHeightSm?: number
  minHeightMd?: number
  minHeightLg?: number
  children: ({ width, height, ready }: { width: number; height: number; ready: boolean }) => React.ReactNode
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
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0, ready: false })
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>()
    const lastWidthRef = React.useRef(0)

    // Combine refs
    React.useImperativeHandle(ref, () => containerRef.current!, [])

    React.useEffect(() => {
      const element = containerRef.current
      if (!element) return

      const updateDimensions = (width: number, height: number) => {
        // Ignore width changes < 4px to avoid loops
        if (Math.abs(width - lastWidthRef.current) < 4 && lastWidthRef.current > 0) {
          return
        }
        
        lastWidthRef.current = width
        
        // Debounce updates by 100ms
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          setDimensions({
            width,
            height,
            ready: width > 0
          })
        }, 100)
      }

      // Try ResizeObserver first
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            updateDimensions(width, height)
          }
        })

        resizeObserver.observe(element)
        
        // Initial measurement
        const { offsetWidth, offsetHeight } = element
        updateDimensions(offsetWidth, offsetHeight)

        return () => {
          resizeObserver.disconnect()
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
          }
        }
      } else {
        // Fallback to window resize
        const handleResize = () => {
          const { offsetWidth, offsetHeight } = element
          updateDimensions(offsetWidth, offsetHeight)
        }

        window.addEventListener('resize', handleResize)
        
        // Initial measurement
        handleResize()

        return () => {
          window.removeEventListener('resize', handleResize)
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
          }
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
        {dimensions.ready ? (
          children(dimensions)
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