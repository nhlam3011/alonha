import React from "react";
import Link from "next/link";

export type StatColor = "blue" | "sky" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "indigo";

interface DashboardStatsProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string; // e.g., "so với tháng trước"
        positive?: boolean;
    };
    color?: StatColor;
    href?: string;
    className?: string;
}

const colorStyles: Record<StatColor, {
    bg: string;
    text: string;
    border: string;
    gradient: string;
}> = {
    blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
        gradient: "from-blue-500/10 to-blue-500/5"
    },
    sky: {
        bg: "bg-sky-50",
        text: "text-sky-600",
        border: "border-sky-100",
        gradient: "from-sky-500/10 to-sky-500/5"
    },
    emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        gradient: "from-emerald-500/10 to-emerald-500/5"
    },
    violet: {
        bg: "bg-violet-50",
        text: "text-violet-600",
        border: "border-violet-100",
        gradient: "from-violet-500/10 to-violet-500/5"
    },
    amber: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        gradient: "from-amber-500/10 to-amber-500/5"
    },
    rose: {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        gradient: "from-rose-500/10 to-rose-500/5"
    },
    cyan: {
        bg: "bg-cyan-50",
        text: "text-cyan-600",
        border: "border-cyan-100",
        gradient: "from-cyan-500/10 to-cyan-500/5"
    },
    indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
        gradient: "from-indigo-500/10 to-indigo-500/5"
    },
};

// Dark mode styles using CSS variables
const darkColorStyles: Record<StatColor, { bg: string; text: string; border: string }> = {
    blue: {
        bg: "[&]:bg-blue-950/50",
        text: "[&]:text-blue-400",
        border: "[&]:border-blue-800/50"
    },
    sky: {
        bg: "[&]:bg-sky-950/50",
        text: "[&]:text-sky-400",
        border: "[&]:border-sky-800/50"
    },
    emerald: {
        bg: "[&]:bg-emerald-950/50",
        text: "[&]:text-emerald-400",
        border: "[&]:border-emerald-800/50"
    },
    violet: {
        bg: "[&]:bg-violet-950/50",
        text: "[&]:text-violet-400",
        border: "[&]:border-violet-800/50"
    },
    amber: {
        bg: "[&]:bg-amber-950/50",
        text: "[&]:text-amber-400",
        border: "[&]:border-amber-800/50"
    },
    rose: {
        bg: "[&]:bg-rose-950/50",
        text: "[&]:text-rose-400",
        border: "[&]:border-rose-800/50"
    },
    cyan: {
        bg: "[&]:bg-cyan-950/50",
        text: "[&]:text-cyan-400",
        border: "[&]:border-cyan-800/50"
    },
    indigo: {
        bg: "[&]:bg-indigo-950/50",
        text: "[&]:text-indigo-400",
        border: "[&]:border-indigo-800/50"
    },
};

export function DashboardStats({ label, value, icon, trend, color = "blue", href, className = "" }: DashboardStatsProps) {
    const styles = colorStyles[color];
    const darkStyles = darkColorStyles[color];

    const Content = (
        <>
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-50`} />

            <div className="relative flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--muted-foreground)] truncate">{label}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{value}</span>
                    </div>
                </div>
                <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${styles.bg} ${styles.text} transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
            </div>

            {trend && (
                <div className="relative mt-4 flex items-center gap-2 text-xs">
                    <span
                        className={trend.positive ? "badge-success" : "badge-destructive"}
                    >
                        {trend.positive ? (
                            <svg className="mr-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        ) : (
                            <svg className="mr-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        )}
                        {Math.abs(trend.value)}%
                    </span>
                    <span className="text-[var(--muted-foreground)] truncate">{trend.label}</span>
                </div>
            )}
        </>
    );

    const containerClasses = `group relative overflow-hidden rounded-2xl border bg-[var(--card)] p-4 sm:p-5 lg:p-6 transition-all duration-300 hover:shadow-lg ${styles.border} ${className}`;

    if (href) {
        return (
            <Link href={href} className={`${containerClasses} block hover:-translate-y-1`}>
                {Content}
            </Link>
        );
    }

    return <div className={containerClasses}>{Content}</div>;
}
