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
    iconBg: string;
    iconText: string;
    gradient: string;
    border: string;
}> = {
    blue: {
        iconBg: "bg-blue-100 dark:bg-blue-500/20",
        iconText: "text-blue-600 dark:text-blue-400",
        gradient: "from-blue-500/20 to-transparent dark:from-blue-500/10",
        border: "border-[var(--border)] lg:border-blue-200/50 lg:dark:border-blue-500/20 hover:border-blue-400/50 dark:hover:border-blue-500/50",
    },
    sky: {
        iconBg: "bg-sky-100 dark:bg-sky-500/20",
        iconText: "text-sky-600 dark:text-sky-400",
        gradient: "from-sky-500/20 to-transparent dark:from-sky-500/10",
        border: "border-[var(--border)] lg:border-sky-200/50 lg:dark:border-sky-500/20 hover:border-sky-400/50 dark:hover:border-sky-500/50",
    },
    emerald: {
        iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
        iconText: "text-emerald-600 dark:text-emerald-400",
        gradient: "from-emerald-500/20 to-transparent dark:from-emerald-500/10",
        border: "border-[var(--border)] lg:border-emerald-200/50 lg:dark:border-emerald-500/20 hover:border-emerald-400/50 dark:hover:border-emerald-500/50",
    },
    violet: {
        iconBg: "bg-violet-100 dark:bg-violet-500/20",
        iconText: "text-violet-600 dark:text-violet-400",
        gradient: "from-violet-500/20 to-transparent dark:from-violet-500/10",
        border: "border-[var(--border)] lg:border-violet-200/50 lg:dark:border-violet-500/20 hover:border-violet-400/50 dark:hover:border-violet-500/50",
    },
    amber: {
        iconBg: "bg-amber-100 dark:bg-amber-500/20",
        iconText: "text-amber-600 dark:text-amber-400",
        gradient: "from-amber-500/20 to-transparent dark:from-amber-500/10",
        border: "border-[var(--border)] lg:border-amber-200/50 lg:dark:border-amber-500/20 hover:border-amber-400/50 dark:hover:border-amber-500/50",
    },
    rose: {
        iconBg: "bg-rose-100 dark:bg-rose-500/20",
        iconText: "text-rose-600 dark:text-rose-400",
        gradient: "from-rose-500/20 to-transparent dark:from-rose-500/10",
        border: "border-[var(--border)] lg:border-rose-200/50 lg:dark:border-rose-500/20 hover:border-rose-400/50 dark:hover:border-rose-500/50",
    },
    cyan: {
        iconBg: "bg-cyan-100 dark:bg-cyan-500/20",
        iconText: "text-cyan-600 dark:text-cyan-400",
        gradient: "from-cyan-500/20 to-transparent dark:from-cyan-500/10",
        border: "border-[var(--border)] lg:border-cyan-200/50 lg:dark:border-cyan-500/20 hover:border-cyan-400/50 dark:hover:border-cyan-500/50",
    },
    indigo: {
        iconBg: "bg-indigo-100 dark:bg-indigo-500/20",
        iconText: "text-indigo-600 dark:text-indigo-400",
        gradient: "from-indigo-500/20 to-transparent dark:from-indigo-500/10",
        border: "border-[var(--border)] lg:border-indigo-200/50 lg:dark:border-indigo-500/20 hover:border-indigo-400/50 dark:hover:border-indigo-500/50",
    },
};

export function DashboardStats({ label, value, icon, trend, color = "blue", href, className = "" }: DashboardStatsProps) {
    const styles = colorStyles[color];

    const Content = (
        <div className="flex flex-col h-full justify-between">
            {/* Background radiant glow */}
            <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-gradient-to-br ${styles.gradient} blur-2xl opacity-60 group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${styles.iconBg} ${styles.iconText} shadow-sm transition-transform duration-300 group-hover:-translate-y-1`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${trend.positive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"}`}>
                            {trend.positive ? (
                                <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            )}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>

                <div className="mt-4 flex-1">
                    <p className="text-[13px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{label}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">{value}</h3>
                </div>

                {trend && trend.label && (
                    <div className="mt-4 text-[13px] text-[var(--muted-foreground)]">
                        {trend.label}
                    </div>
                )}
            </div>
        </div>
    );

    const containerClasses = `group relative overflow-hidden rounded-2xl border bg-[var(--card)]/80 backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl ${styles.border} ${className}`;

    if (href) {
        return (
            <Link href={href} className={`${containerClasses} block hover:-translate-y-1`}>
                {Content}
            </Link>
        );
    }

    return <div className={containerClasses}>{Content}</div>;
}
