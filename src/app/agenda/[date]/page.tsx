"use client";

import { createClient } from "@/lib/supabase";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Clock, MapPin, Video, Calendar as CalendarIcon, FilePenLine, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, use, useEffect } from "react";
import { PatientHistoryModal } from "@/components/PatientHistoryModal";
import { NewMedicalRecordModal } from "@/components/NewMedicalRecordModal";

// Update props type to Promise
interface AgendaDayPageProps {
    params: Promise<{
        date: string;
    }>;
}

export default function AgendaDayPage({ params }: AgendaDayPageProps) {
    // Unwrap params using React.use()
    const { date } = use(params);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isRecordOpen, setIsRecordOpen] = useState(false);

    let dateObj = new Date();
    try {
        dateObj = parseISO(date);
    } catch (e) {
        // Fallback
    }

    // Check if the page date is today
    const isToday = isSameDay(dateObj, new Date());

    const fetchSessions = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("*, patients(name, phone)")
                .gte("date_time", `${date}T00:00:00`)
                .lte("date_time", `${date}T23:59:59`)
                .neq("status", "completed") // Filter out completed sessions
                .order("date_time", { ascending: true });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (date) {
            fetchSessions();
        }
    }, [date]);

    const handleCardClick = (session: any) => {
        setSelectedSession(session);
        setIsHistoryOpen(true);
    };

    const handleStartSession = (e: React.MouseEvent, session: any) => {
        e.stopPropagation(); // Prevent card click
        setSelectedSession(session);
        setIsRecordOpen(true);
    };

    return (
        <Shell>
            <div className="p-4 md:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/agenda"
                        className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 capitalize">
                            {format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </h1>
                        <p className="text-sm text-zinc-500">
                            {sessions.length} sessões agendadas
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : sessions.length > 0 ? (
                        sessions.map((session: any) => {
                            const patientName = session.patients?.name || "Desconhecido";
                            const initials = patientName.substring(0, 2).toUpperCase();
                            const startTime = new Date(session.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const endTime = new Date(new Date(session.date_time).getTime() + session.duration_minutes * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const isOnline = session.type === 'online';
                            const borderColor = isOnline ? "border-purple-500" : "border-blue-500";
                            const avatarBg = isOnline ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600";
                            const typeLabel = isOnline ? "Online" : "Presencial";

                            return (
                                <div
                                    key={session.id}
                                    onClick={() => handleCardClick(session)}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-zinc-50 transition-all border-l-4 shadow-sm hover:shadow-md cursor-pointer",
                                        borderColor
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-12 w-12 flex items-center justify-center rounded-xl text-sm font-bold",
                                            avatarBg
                                        )}
                                    >
                                        {initials}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                                            {patientName}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>
                                                    {startTime} - {endTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                                                {typeLabel}
                                            </div>
                                        </div>
                                    </div>

                                    {isToday && (
                                        <button
                                            onClick={(e) => handleStartSession(e, session)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all scale-90 group-hover:scale-100 z-10"
                                            title="Iniciar Atendimento"
                                        >
                                            <FilePenLine size={18} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-zinc-400 bg-white rounded-3xl border border-zinc-100">
                            <CalendarIcon size={48} className="mb-4 text-zinc-200" />
                            <p className="text-lg font-medium text-zinc-500">Dia livre</p>
                            <p className="text-sm">Nenhuma sessão agendada para esta data.</p>
                        </div>
                    )}
                </div>
            </div>

            <PatientHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                patientName={selectedSession?.patients?.name || ""}
                patientId={selectedSession?.patient_id}
            />

            <NewMedicalRecordModal
                isOpen={isRecordOpen}
                onClose={() => {
                    setIsRecordOpen(false);
                    fetchSessions();
                }}
                patientName={selectedSession?.patients?.name}
                patientId={selectedSession?.patient_id}
                initialSessionType={selectedSession?.type ? selectedSession.type.charAt(0).toUpperCase() + selectedSession.type.slice(1) : undefined}
                appointmentId={selectedSession?.id}
            />
        </Shell>
    );
}
