"use client";

import { Shell } from "@/components/Shell";
import { useState, useEffect, useCallback } from "react";
import { Plus, Clock, Video, MapPin, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/Calendar";
import Link from "next/link";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export default function AgendaPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [daySessions, setDaySessions] = useState<any[]>([]);
    const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    // Fetch appointments for the selected day (detailed list)
    const fetchDaySessions = useCallback(async () => {
        setLoading(true);
        const dayString = format(selectedDate, "yyyy-MM-dd");

        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("*, patients(name, phone)")
                .gte("date_time", `${dayString}T00:00:00`)
                .lte("date_time", `${dayString}T23:59:59`)
                .neq("status", "completed") // Filter out completed sessions
                .order("date_time", { ascending: true });

            if (error) throw error;
            setDaySessions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, supabase]);

    // Fetch appointments count for the entire month (for calendar dots)
    const fetchMonthCounts = useCallback(async () => {
        const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");

        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("date_time")
                .gte("date_time", `${start}T00:00:00`)
                .lte("date_time", `${end}T23:59:59`);

            if (error) throw error;

            // Group by day
            const counts: Record<string, number> = {};
            data?.forEach((apt) => {
                const day = apt.date_time.split("T")[0];
                counts[day] = (counts[day] || 0) + 1;
            });
            setMonthCounts(counts);

        } catch (error) {
            console.error(error);
        }
    }, [selectedDate, supabase]); // Note: Ideally should depend on month change, but selectedDate covers it

    useEffect(() => {
        fetchDaySessions();
        fetchMonthCounts();
    }, [fetchDaySessions, fetchMonthCounts]);

    return (
        <Shell>
            <div className="p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Agenda</h1>
                        <p className="text-sm md:text-base text-zinc-500 mt-1">
                            Visualize e gerencie suas sessões
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 w-full md:w-auto justify-center"
                    >
                        <Plus size={18} />
                        Agendar Sessão
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Calendar Component (Widget) */}
                    <div className="w-full lg:w-3/5 xl:w-2/3">
                        <Calendar
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            sessionsMap={monthCounts}
                        />
                    </div>

                    {/* Daily List */}
                    <div className="w-full lg:w-2/5 xl:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 min-h-[400px] md:min-h-[600px]">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">Hoje</h2>
                                <p className="text-sm text-zinc-500 capitalize">
                                    {format(selectedDate, "d 'de' MMMM, EEEE", { locale: ptBR })}
                                </p>
                            </div>
                            <Link
                                href={`/agenda/${format(selectedDate, "yyyy-MM-dd")}`}
                                className="bg-zinc-100 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
                            >
                                {daySessions.length} sessões
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-500" />
                                </div>
                            ) : daySessions.length > 0 ? (
                                daySessions.map((session: any) => {
                                    const time = new Date(session.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    const endTime = new Date(new Date(session.date_time).getTime() + session.duration_minutes * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    const patientInitials = session.patients?.name ? session.patients.name.substring(0, 2).toUpperCase() : "??";
                                    const isOnline = session.type === 'online';

                                    return (
                                        <div
                                            key={session.id}
                                            className={cn(
                                                "relative flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors border-l-4",
                                                isOnline ? "border-purple-500" : "border-blue-500"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "h-10 w-10 flex items-center justify-center rounded-xl text-xs font-bold",
                                                    isOnline ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                                )}
                                            >
                                                {patientInitials}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-zinc-900">
                                                    {session.patients?.name || "Paciente Removido"}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        <span>
                                                            {time} - {endTime}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                                                        <span className="capitalize">{session.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                                    <CalendarIcon size={48} className="mb-4 text-zinc-200" />
                                    <p>Nenhuma sessão para este dia.</p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="text-sm text-blue-500 font-medium mt-2 hover:underline"
                                    >
                                        Agendar agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchDaySessions();
                    fetchMonthCounts();
                }}
                preSelectedDate={selectedDate}
            />
        </Shell >
    );
}
