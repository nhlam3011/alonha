"use client";

import { useEffect, useState } from "react";

export function Greeting({ name }: { name?: string | null }) {
    const [greeting, setGreeting] = useState("Kính chào");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Chào buổi sáng");
        else if (hour < 18) setGreeting("Chào buổi chiều");
        else setGreeting("Chào buổi tối");
    }, []);

    return (
        <>
            <p className="text-sm font-medium text-[var(--primary)] mb-1 uppercase tracking-wider">{greeting},</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2 mt-1 drop-shadow-sm">
                {name || "Khách"}
            </h1>
        </>
    );
}
