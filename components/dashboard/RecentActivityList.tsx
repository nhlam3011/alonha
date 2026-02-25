import React from "react";
import Link from "next/link";

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    icon?: React.ReactNode;
    status?: "success" | "warning" | "error" | "info";
    href?: string;
}

interface RecentActivityListProps {
    title: string;
    activities: ActivityItem[];
    className?: string;
    emptyMessage?: string;
}

export function RecentActivityList({
    title,
    activities,
    className = "",
    emptyMessage = "Chưa có hoạt động nào.",
}: RecentActivityListProps) {
    return (
        <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm ${className}`}>
            <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{title}</h3>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-center text-sm text-[var(--muted-foreground)] py-4">{emptyMessage}</p>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="group flex items-start gap-3">
                            <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] transition-colors group-hover:border-[var(--primary)] group-hover:bg-[var(--primary-light)]`}
                            >
                                {item.icon || (
                                    <svg className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap justify-between gap-x-2">
                                    {item.href ? (
                                        <Link href={item.href} className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-1">
                                            {item.title}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{item.title}</p>
                                    )}
                                    <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">{item.timestamp}</span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">{item.description}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
