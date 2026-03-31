"use client";

import { Shell } from "@/components/Shell";
import {
    User,
    Bell,
    Shield,
    CreditCard,
    Palette,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

const settingsItems = [
    {
        icon: User,
        title: "Perfil",
        description: "Gerencie suas informações pessoais e profissionais",
        bg: "bg-blue-50",
        color: "text-blue-600",
        href: "#"
    },
    {
        icon: Bell,
        title: "Notificações",
        description: "Configure alerts e lembretes",
        bg: "bg-sky-50",
        color: "text-sky-600",
        href: "#"
    },
    {
        icon: Shield,
        title: "Segurança",
        description: "Senha, autenticação e privacidade",
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        href: "#"
    },
    {
        icon: CreditCard,
        title: "Pagamentos",
        description: "Métodos de pagamento e faturamento",
        bg: "bg-amber-50",
        color: "text-amber-600",
        href: "#"
    },
    {
        icon: HelpCircle,
        title: "Ajuda",
        description: "Central de suporte e tutoriais",
        bg: "bg-zinc-100",
        color: "text-zinc-600",
        href: "#"
    },
];

export default function ConfiguracoesPage() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState("Carregando...");
    const [userCrp, setUserCrp] = useState("");
    const [userInitials, setUserInitials] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) {
                    setUserEmail(user.email);
                }

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
        <Shell>
            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Configurações</h1>
                    <p className="text-sm md:text-base text-zinc-500 mt-1">
                        Personalize sua experiência no sistema
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {settingsItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] text-left group"
                        >
                            <div
                                className={cn(
                                    "h-14 w-14 flex items-center justify-center rounded-2xl transition-colors",
                                    item.bg,
                                    item.color
                                )}
                            >
                                <item.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="rounded-3xl bg-white p-6 md:p-8 border border-zinc-100 shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-900 mb-6">
                        Informações da Conta
                    </h2>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold">
                            {userInitials}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900">
                                {userName}
                            </h3>
                            {userCrp ? (
                                <p className="text-zinc-500 font-medium">CRP {userCrp}</p>
                            ) : (
                                <p className="text-zinc-400 font-medium">CRP não informado</p>
                            )}
                            <p className="text-zinc-400 text-sm mt-1">
                                {userEmail || "Carregando email..."}
                            </p>
                        </div>
                        <button className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors w-full md:w-auto">
                            Editar perfil
                        </button>
                    </div>
                </div>
            </div>
        </Shell>
    );
}
