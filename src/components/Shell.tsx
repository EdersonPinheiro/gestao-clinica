"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { X } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-zinc-50 relative">
            {/* Desktop Sidebar - fixed width, ignored on mobile */}
            <div className="hidden md:block fixed left-0 top-0 h-full w-64 z-30">
                <Sidebar />
            </div>

            {/* Mobile Sidebar - Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="relative w-64 h-full bg-white shadow-xl animate-in slide-in-from-left duration-200">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute right-4 top-6 text-zinc-400 hover:text-zinc-600"
                        >
                            <X size={20} />
                        </button>
                        <Sidebar
                            className="border-none"
                            onNavigate={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content - Pushed by sidebar only on desktop */}
            <main className="flex-1 flex flex-col md:ml-64 w-full transition-all duration-200">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                {children}
            </main>
        </div>
    )
}
