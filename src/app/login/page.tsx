"use client";

import { useState, useEffect } from "react";
import { Brain, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { createClient } = await import("@/lib/supabase");
                const supabase = createClient();
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    router.replace("/");
                } else {
                    setCheckingSession(false);
                }
            } catch (error) {
                console.error(error);
                setCheckingSession(false);
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert("Erro ao fazer login: " + error.message);
                setIsLoading(false);
                return;
            }

            // Redirect to dashboard
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Ocorreu um erro inesperado.");
            setIsLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            <Brain size={32} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-zinc-900 leading-none tracking-tight">PsicoGest</span>
                            <span className="text-sm text-zinc-500 font-medium">Gestão Clínica</span>
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
                    <div className="p-8">
                        <div className="mb-8 text-center">
                            <h1 className="text-xl font-bold text-zinc-900">Bem-vindo de volta!</h1>
                            <p className="text-sm text-zinc-500 mt-1">Acesse sua conta para continuar.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 ml-1">E-mail</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemplo@clinica.com"
                                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-3 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-zinc-700">Senha</label>
                                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-3 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6 group"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Entrar na Plataforma
                                        <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                        <p className="text-sm text-zinc-500">
                            Não tem uma conta? <Link href="#" className="text-blue-600 font-medium hover:underline">Fale com o suporte</Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400 mt-8">
                    © 2026 PsicoGest. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
