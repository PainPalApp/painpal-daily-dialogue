// src/components/ui/chart.tsx
import * as React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

// Generic point type (x label + y value)
export type XYPoint = { x: string; y: number; [k: string]: unknown };

export type PainLineChartProps = {
  data: XYPoint[];
  height: number;                 // numeric height (px) passed from ChartContainer
  xKey?: keyof XYPoint;           // default 'x'
  yKey?: keyof XYPoint;           // default 'y'
  yDomain?: [number, number];     // default [0,10]
};

function PainTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value as number | undefined;
  return (
    <div style={{ background:'#121225', border:'1px solid #232445', padding:8, borderRadius:8 }}>
      <div style={{ color:'#BDB8E6', fontSize:12 }}>{String(label)}</div>
      {typeof v === 'number' && (
        <div style={{ color:'#EAE7FF', fontWeight:600 }}>{v.toFixed(1)}/10</div>
      )}
    </div>
  );
}

export const PainLineChart: React.FC<PainLineChartProps> = ({
  data, height, xKey = 'x', yKey = 'y', yDomain = [0, 10],
}) => (
  <div style={{ width:'100%', height }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 16, left: 28 }}>
        <CartesianGrid stroke="#232445" strokeOpacity={0.6} vertical={false} />
        <XAxis
          dataKey={xKey as string}
          tick={{ fill:'#BDB8E6', fontSize:12 }}
          tickLine={false}
          axisLine={{ stroke:'#232445' }}
          minTickGap={24}
        />
        <YAxis
          domain={yDomain}
          tick={{ fill:'#BDB8E6', fontSize:12 }}
          tickLine={false}
          axisLine={{ stroke:'#232445' }}
        />
        <Tooltip content={<PainTooltip />} />
        <Line
          type="monotone"
          dataKey={yKey as string}
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);