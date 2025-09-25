"use client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Label, YAxis, CartesianGrid } from 'recharts';
import { useEffect, useState, useMemo } from 'react';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(30,30,30,0.92)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        color: '#fff',
        fontSize: 18,
        minWidth: 90,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6
      }}>
        <span style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{label}</span>
        {payload.map((entry: any, idx: number) => (
          <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
            <span style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 3,
              background: entry.color,
              marginRight: 6
            }} />
            <span style={{ fontWeight: 500 }}>{entry.name}: <span style={{ color: entry.color }}>{entry.value}</span></span>
          </span>
        ))}
      </div>
    );
  }
  return null;
};

export default function BarChartComponent({ data }: { data?: { name: string; total: number }[] }) {
  const [chartHeight, setChartHeight] = useState(220);

  const isWindowDefined = typeof window !== 'undefined';
  const windowWidth = isWindowDefined ? window.innerWidth : 1024;

  const fontSize = useMemo(() => {
    if (isWindowDefined) {
      if (windowWidth < 400) return 11;
      if (windowWidth < 500) return 13;
      if (windowWidth < 768) return 15;
    }
    return 17;
  }, [isWindowDefined, windowWidth]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 400) {
        setChartHeight(140);
      } else if (window.innerWidth < 500) {
        setChartHeight(180);
      } else if (window.innerWidth < 768) {
        setChartHeight(200);
      } else {
        setChartHeight(220);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={chartHeight} minHeight={120}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
        <XAxis
          dataKey="name"
          type="category"
          tick={{ fontSize, fill: '#fff' }}
          axisLine={{ stroke: '#fff' }}
        >
          <Label value="Quarter" offset={-10} position="insideBottom" style={{ fill: '#fff', fontSize: fontSize + 1 }} />
        </XAxis>
        <YAxis
          padding={{ top: 15 }}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#fff", fontSize: fontSize + 1 }}
          tickFormatter={(value) => value === 0 ? '£0' : `£${value / 1000}K`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(250,204,21,0.08)' }} />
        <CartesianGrid stroke="#fff" strokeDasharray="5" />
        <Bar dataKey="total" stackId="total" fill="var(--success-color)" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="total" position="top" style={{ fill: '#facc15', fontSize: fontSize - 1, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
