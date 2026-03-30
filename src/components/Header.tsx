"use client";

import { Search, Bell, Menu, X, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick: () => void;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
}

export function Header({ onMenuClick }: HeaderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data as Notification[]);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for updates from other components
        window.addEventListener('notification-updated', fetchNotifications);

        // Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification-updated', fetchNotifications);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="flex h-20 items-center justify-between px-4 md:px-8 bg-white border-b border-zinc-100 sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-50 rounded-lg"
                >
                    <Menu size={24} />
                </button>

                <div className="flex-1" />
            </div>

            <div className="flex items-center gap-3 md:gap-6" ref={dropdownRef}>
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsOpen(!isOpen);
                            if (!isOpen) fetchNotifications();
                        }}
                        className="relative text-zinc-500 hover:text-zinc-700 p-2 rounded-full hover:bg-zinc-50 transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                        )}
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
                                <h3 className="font-semibold text-zinc-900">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                                        {unreadCount} novas
                                    </span>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();

                                            // Optimistic update
                                            setNotifications([]);

                                            // Remote delete
                                            const supabase = createClient();
                                            await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                                        }}
                                        className="text-xs text-zinc-500 hover:text-red-600 font-medium ml-auto pl-3 uppercase tracking-wider"
                                    >
                                        Limpar tudo
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-zinc-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-4 hover:bg-zinc-50 transition-colors flex gap-3 group relative cursor-pointer",
                                                    !notification.read && "bg-blue-50/30"
                                                )}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className={cn(
                                                    "h-2 w-2 mt-2 rounded-full shrink-0",
                                                    !notification.read ? "bg-blue-500" : "bg-zinc-200"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-medium mb-0.5 truncate pr-6",
                                                        !notification.read ? "text-zinc-900" : "text-zinc-600"
                                                    )}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-zinc-500 mb-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteNotification(notification.id, e)}
                                                    className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Excluir notificação"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-zinc-400 flex flex-col items-center">
                                        <Bell size={32} className="mb-2 opacity-20" />
                                        <p className="text-sm">Nenhuma notificação</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
