"use client";

import React, { useMemo } from "react";

interface ChartDataPoint {
    label: string;
    value: number;
}

interface DashboardChartProps {
    title: string;
    data: ChartDataPoint[];
    type?: "bar" | "line";
    height?: number;
    color?: string; // CSS color string or tailwind class
    className?: string;
    valuePrefix?: string;
    valueSuffix?: string;
}

export function DashboardChart({
    title,
    data,
    type = "bar",
    height = 200,
    color = "var(--primary)",
    className = "",
    valuePrefix = "",
    valueSuffix = "",
}: DashboardChartProps) {
    const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

    // Use a simple scale function
    const scale = (value: number) => (value / maxValue) * 100;

    return (
        <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm ${className}`}>
            <h3 className="mb-6 text-lg font-semibold text-[var(--foreground)]">{title}</h3>

            <div className="flex items-end justify-between gap-2" style={{ height }}>
                {data.map((point, index) => (
                    <div key={index} className="group relative flex h-full w-full flex-col items-center justify-end">
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-[var(--foreground)] px-2 py-1 text-xs font-semibold text-[var(--background)] shadow-sm group-hover:block whitespace-nowrap">
                            {point.label}: {valuePrefix}{point.value.toLocaleString()}{valueSuffix}
                        </div>

                        {/* Bar */}
                        {type === "bar" && (
                            <div
                                className="w-full max-w-[40px] rounded-t-lg opacity-80 transition-all hover:opacity-100 relative group"
                                style={{
                                    height: `${scale(point.value)}%`,
                                    background: color, // Fallback if regular css color
                                    minHeight: "4px"
                                }}
                            >
                                {/* Shiny effect on hover */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                            </div>
                        )}

                        {/* Line Point (Simplified implementation for line chart - mostly just points for now) */}
                        {type === "line" && (
                            <div
                                className="relative z-10 h-3 w-3 rounded-full border-2 border-[var(--background)] transition-all group-hover:scale-125"
                                style={{
                                    bottom: `calc(${scale(point.value)}% - 6px)`, // Align center of dot
                                    backgroundColor: color,
                                }}
                            />
                        )}

                        {/* Connecting lines for line chart would be complex with just flex/absolute. 
                For a robust line chart without libraries, SVG is better. 
                Let's stick to Bar for now or basic points for 'line' visualization style. 
            */}

                        <div className="mt-3 text-xs font-medium text-[var(--muted-foreground)] line-clamp-1 w-full text-center">
                            {point.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
