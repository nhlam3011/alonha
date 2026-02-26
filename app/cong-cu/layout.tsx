import { ReactNode } from "react";
import ToolsNavigation from "./components/ToolsNavigation";

export const metadata = {
    title: "Công cụ Bất động sản | AloNha",
    description: "Các công cụ hỗ trợ tính toán, phong thủy, so sánh BĐS",
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="layout-container py-6 lg:py-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                    {/* Sidebar / Topbar */}
                    <div className="w-full lg:w-64 shrink-0">
                        <ToolsNavigation />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
