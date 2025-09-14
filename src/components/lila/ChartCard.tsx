import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader"

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  heightSm?: number
  heightMd?: number
  heightLg?: number
  children: React.ReactElement
  config?: Record<string, any>
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
    ...props 
  }, ref) => {
    const heightClasses = cn(
      `h-[${heightSm}px]`,
      `md:h-[${heightMd}px]`,
      `lg:h-[${heightLg}px]`
    )

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
            {children}
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }
)
ChartCard.displayName = "ChartCard"

export { ChartCard }