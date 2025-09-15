import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader"
import { useChartTheme } from "@/hooks/useChartTheme"

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  heightSm?: number
  heightMd?: number
  heightLg?: number
  children: React.ReactElement
  config?: Record<string, any>
  chartType?: 'line' | 'bar' | 'area' | 'sparkline'
}

const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    actions, 
    heightSm = 80, 
    heightMd = 120, 
    heightLg = 160,
    children,
    config = {},
    chartType = 'line',
    ...props 
  }, ref) => {
    // Use centralized chart theming
    const { mobileHeights } = useChartTheme({ type: chartType })
    
    const heightClasses = cn(
      `h-[${heightSm}px]`,
      `md:h-[${heightMd}px]`,
      `lg:h-[${heightLg}px]`
    )

    // Clone child and inject chart theme if it's a Chart.js component
    const childWithTheme = React.cloneElement(children, {
      ...children.props,
      // Pass chart type for theme customization
      chartType,
    })

    return (
      <Card ref={ref} className={cn("insights-card", className)} {...props}>
        <CardContent className="p-4 md:p-5 space-y-4">
          <SectionHeader 
            title={title} 
            subtitle={subtitle} 
            actions={actions}
          />
          
          <ChartContainer 
            config={config}
            className={cn("w-full", heightClasses)}
          >
            {childWithTheme}
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }
)
ChartCard.displayName = "ChartCard"

export { ChartCard }