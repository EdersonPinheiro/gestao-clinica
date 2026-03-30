import { MapPin, Video, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionListProps {
    sessions?: any[]; // We will type this properly later
}

export function SessionList({ sessions = [] }: SessionListProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Próximas Sessões</h2>
                        <p className="text-sm text-zinc-500">
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>
                </div>
                <div className="p-8 text-center bg-white rounded-xl border border-zinc-100 text-zinc-500">
                    <p>Nenhuma sessão agendada para hoje.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900">Próximas Sessões</h2>
                    <p className="text-sm text-zinc-500 capitalize">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <Link href="/agenda" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Ver agenda completa
                </Link>
            </div>

            <div className="space-y-3">
                {sessions.map((session) => {
                    // Adapt Supabase data to UI
                    const patientName = session.patients?.name || "Paciente Desconhecido";
                    const initials = patientName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                    const time = session.date_time ? new Date(session.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--";
                    const isOnline = session.type === 'online';

                    return (
                        <div
                            key={session.id}
                            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${isOnline ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                                    {initials}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-zinc-900">{patientName}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700`}>
                                            {session.status || "Agendado"}
                                        </span>
                                    </div>

                                    <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>
                                                {time} • {session.duration_minutes || 50}min
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isOnline ? <Video size={14} /> : <MapPin size={14} />}
                                            <span>{isOnline ? "Online" : "Presencial"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
