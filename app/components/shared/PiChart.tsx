"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  PieLabelRenderProps,
  Tooltip,
} from "recharts";
import { useEffect, useState, useMemo, useRef } from "react";

const COLORS = ["#facc15", "#0f766e", "#a16207", "#d97706"];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  value,
}: PieLabelRenderProps & { name?: string; value?: number }) => {
  const RADIAN = Math.PI / 180;
  const nCx = Number(cx ?? 0);
  const nCy = Number(cy ?? 0);
  const nInner = Number(innerRadius ?? 0);
  const nOuter = Number(outerRadius ?? 0);
  const nMid = Number(midAngle ?? 0);
  const nValue = Number(value ?? 0);
  // Add a small offset to avoid overlap with the pie segment
  const radius = nInner + (nOuter - nInner) * 0.8;
  const x = nCx + radius * Math.cos(-nMid * RADIAN);
  const y = nCy + radius * Math.sin(-nMid * RADIAN);
  // Responsive font size
  const fontSize = nOuter < 60 ? 10 : nOuter < 90 ? 12 : 14;
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > nCx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight="bold"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {name}: {nValue}
    </text>
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) => {
  if (active && payload && payload.length) {
    const entry = payload[0] as any;
    return (
      <div
        style={{
          background: "rgba(30,30,30,0.92)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          color: "#fff",
          fontSize: 18,
          minWidth: 90,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
          {entry.name}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 17,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              background: entry.color,
              marginRight: 6,
            }}
          />
          <span style={{ fontWeight: 500 }}>{entry.value}</span>
        </span>
      </div>
    );
  }
  return null;
};

export default function PieChartComponent({
  skillCounts,
}: {
  skillCounts?: { name: string; value: number }[];
}) {
  const [chartHeight, setChartHeight] = useState(220);
  const [tooltipActive, setTooltipActive] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const outerRadius = useMemo(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 400) return 50;
      if (window.innerWidth < 500) return 70;
      if (window.innerWidth < 768) return 90;
    }
    return 110;
  }, [typeof window !== "undefined" ? window.innerWidth : 1024]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 400) {
        setChartHeight(120);
      } else if (window.innerWidth < 500) {
        setChartHeight(160);
      } else if (window.innerWidth < 768) {
        setChartHeight(200);
      } else {
        setChartHeight(220);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  // Hide tooltip on outside click (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
        setTooltipActive(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [isMobile]);

  // Custom Tooltip wrapper to control visibility
  const ControlledTooltip = (props: any) => {
    // Sync tooltipActive with props.active using useEffect to avoid setState in render
    useEffect(() => {
      if (isMobile) {
        if (props.active && !tooltipActive) setTooltipActive(true);
        if (!props.active && tooltipActive) setTooltipActive(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.active, isMobile]);
    if (isMobile) {
      return tooltipActive ? <CustomTooltip {...props} /> : null;
    }
    return <CustomTooltip {...props} />;
  };

  return (
    <div ref={chartRef} style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer width="100%" height={chartHeight} minHeight={100}>
        {skillCounts && skillCounts.length > 0 ? (
          <PieChart>
            <Pie
              data={skillCounts}
              dataKey="value"
              outerRadius={outerRadius}
              stroke="none"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {skillCounts?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ControlledTooltip />} />
          </PieChart>
        ) : (
          <p> No skills data available </p>
        )}
      </ResponsiveContainer>
    </div>
  );
}
