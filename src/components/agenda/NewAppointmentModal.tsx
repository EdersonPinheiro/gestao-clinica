"use client";

import { useState, useEffect } from "react";
import { X, Search, Calendar, Clock, Check, User } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Patient {
    id: string;
    name: string;
    phone: string;
}

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedDate?: Date;
}

export function NewAppointmentModal({ isOpen, onClose, onSuccess, preSelectedDate }: NewAppointmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Form states
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("presencial");
    const [duration, setDuration] = useState("50");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen && preSelectedDate) {
            setDate(preSelectedDate.toISOString().split('T')[0]);
        }
    }, [isOpen, preSelectedDate]);

    // Search patients
    useEffect(() => {
        const searchPatients = async () => {
            if (searchTerm.length < 2) {
                setPatients([]);
                return;
            }

            setIsSearching(true);
            const supabase = createClient();
            const { data } = await supabase
                .from('patients')
                .select('id, name, phone')
                .ilike('name', `%${searchTerm}%`)
                .limit(5);

            setPatients(data || []);
            setIsSearching(false);
        };

        const timeoutId = setTimeout(searchPatients, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !date || !time) return;

        setLoading(true);
        try {
            const supabase = createClient();

            // Combine date and time to ISO String (handling timezone)
            const localDateTime = new Date(`${date}T${time}:00`);
            const isoDateTime = localDateTime.toISOString();

            const { error } = await supabase.from("appointments").insert({
                patient_id: selectedPatient.id,
                date_time: isoDateTime,
                type,
                duration_minutes: parseInt(duration),
                notes,
                status: "agendado"
            });

            if (error) throw error;

            // Reset and close
            onSuccess?.();
            handleClose();
        } catch (error) {
            console.error(error);
            alert("Erro ao agendar consulta");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedPatient(null);
        setPatients([]);
        setNotes("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <h2 className="text-xl font-bold text-zinc-900">Novo Agendamento</h2>
                    <button onClick={handleClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Paciente</label>
                        {!selectedPatient ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente por nome..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {patients.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-zinc-100 overflow-hidden z-10">
                                        {patients.map(patient => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-center gap-3"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setSearchTerm("");
                                                }}
                                            >
                                                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {patient.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-900">{patient.name}</p>
                                                    <p className="text-xs text-zinc-500">{patient.phone}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">{selectedPatient.name}</p>
                                        <p className="text-xs text-zinc-500">{selectedPatient.phone}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-blue-600 p-2 hover:bg-blue-100 rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Date/Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Data</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Horário</label>
                            <div className="relative">
                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type/Duration Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Tipo</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="presencial">Presencial</option>
                                <option value="online">Online</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Duração (min)</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            >
                                <option value="30">30 min</option>
                                <option value="50">50 min</option>
                                <option value="60">60 min</option>
                                <option value="90">1h 30min</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Observações</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-zinc-900"
                            placeholder="Alguma observação para este agendamento?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedPatient || !date || !time}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                        >
                            {loading ? "Confirmando..." : "Confirmar Agendamento"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
