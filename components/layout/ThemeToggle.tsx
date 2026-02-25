"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("alonha-theme");
    const docTheme = document.documentElement.getAttribute("data-theme");

    let currentTheme: "light" | "dark" = "light";
    if (savedTheme === "dark" || savedTheme === "light") {
      currentTheme = savedTheme;
    } else if (docTheme === "dark" || docTheme === "light") {
      currentTheme = docTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      currentTheme = "dark";
    }
    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.style.colorScheme = currentTheme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(currentTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "alonha-theme" && e.newValue) {
        setTheme(e.newValue as "light" | "dark");
        document.documentElement.setAttribute("data-theme", e.newValue);
        document.documentElement.style.colorScheme = e.newValue;
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem("alonha-theme");
      if (!savedTheme) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        document.documentElement.style.colorScheme = newTheme;
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.style.colorScheme = newTheme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
    localStorage.setItem("alonha-theme", newTheme);
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--muted)] animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[var(--muted)]/60 overflow-hidden transition-all duration-200 hover:bg-[var(--muted)] group"
      title={theme === "dark" ? "Chế độ tối" : "Chế độ sáng"}
    >
      {/* Icon with smooth transition */}
      <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
        {theme === "dark" ? (
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>
    </button>
  );
}
