"use client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const barData = [
  { name: 'Q1', a: 100, b: 30 },
  { name: 'Q2', a: 200, b: 60 },
  { name: 'Q3', a: 300, b: 80 },
  { name: 'Q4', a: 250, b: 70 },
];

export default function BarChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={barData}>
        <XAxis 
            dataKey="name" 
            tick={false} 
            axisLine={{ stroke: '#fff' }} 
        />
        {/* <YAxis /> */}
        <Tooltip />
        <Bar dataKey="b" stackId="a" fill="#0f766e" />
        <Bar dataKey="a" stackId="a" fill="#facc15" />
      </BarChart>
    </ResponsiveContainer>
  );
}
