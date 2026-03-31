"use client";

import { LayoutDashboard, Users, Calendar, Settings, Brain, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Pacientes", href: "/pacientes" },
    { icon: Calendar, label: "Agenda", href: "/agenda" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [userName, setUserName] = useState("Carregando...");
    const [userCrp, setUserCrp] = useState("");
    const [userInitials, setUserInitials] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Usuário";
                const prefix = user.user_metadata?.prefix ? `${user.user_metadata.prefix} ` : "";
                
                // Formatar o nome se o usuário incluiu um prefixo ou usamos diretamente o nome
                const displayName = name.includes("Dr") ? name : `${prefix}${name}`;
                setUserName(displayName);
                
                const crp = user.user_metadata?.crp || "";
                setUserCrp(crp);

                // Pegar as duas primeiras letras para o avatar
                const initialsMatch = name.match(/\b\w/g);
                const initials = initialsMatch ? initialsMatch.join('').substring(0, 2).toUpperCase() : name.substring(0, 2).toUpperCase();
                setUserInitials(initials);
            } else {
                setUserName("Usuário");
                setUserInitials("US");
            }
        };
        fetchUser();
    }, []);

    return (
        <aside className={cn(
            "h-screen w-64 bg-white flex flex-col border-r border-zinc-100",
            className
        )}>
            <div className="p-6 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                    <Brain size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-zinc-900 text-lg leading-tight">PsicoGest</h1>
                    <p className="text-xs text-zinc-500">Gestão Clínica</p>
                </div>
            </div>

            <nav className="flex-1 px-4 mt-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            )}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 min-w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {userInitials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-zinc-900 truncate" title={userName}>
                            {userName}
                        </p>
                        {userCrp ? (
                            <p className="text-xs text-zinc-500 truncate" title={`CRP ${userCrp}`}>CRP {userCrp}</p>
                        ) : (
                            <p className="text-xs text-zinc-400 truncate">CRP não inf.</p>
                        )}
                    </div>
                    <button
                        onClick={async () => {
                            const { createClient } = await import("@/lib/supabase");
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = "/login";
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
