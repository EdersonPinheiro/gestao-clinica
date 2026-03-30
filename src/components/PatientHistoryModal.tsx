"use client";

import { X, FileText, Calendar, ChevronRight, Loader2, Pill, Activity, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface PatientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
    patientId?: string;
}

export function PatientHistoryModal({ isOpen, onClose, patientName, patientId }: PatientHistoryModalProps) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!isOpen || !patientId) return;

            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('medical_records')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('date', { ascending: false });

                if (error) throw error;
                setRecords(data || []);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [isOpen, patientId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-none flex items-center justify-between p-6 border-b border-zinc-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900">Histórico do Paciente</h2>
                        <p className="text-sm text-zinc-500">{patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" />
                        </div>
                    ) : records.length > 0 ? (
                        records.map((record) => (
                            <div key={record.id} className="group flex flex-col gap-3 p-5 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
                                    <div className="flex items-center gap-2 text-zinc-600">
                                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                            <Calendar size={16} />
                                        </div>
                                        <span className="text-sm font-bold capitalize text-zinc-900">
                                            {format(new Date(record.date || record.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                        </span>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium border border-zinc-200 uppercase tracking-wide">
                                            {record.session_type || 'Sessão'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {record.complaints && (
                                        <div className="flex gap-3">
                                            <Activity size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Queixas</p>
                                                <p className="text-sm text-zinc-700">{record.complaints}</p>
                                            </div>
                                        </div>
                                    )}

                                    {record.diagnosis && (
                                        <div className="flex gap-3">
                                            <Stethoscope size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Diagnóstico</p>
                                                <p className="text-sm text-zinc-700">{record.diagnosis}</p>
                                            </div>
                                        </div>
                                    )}

                                    {record.medications && (
                                        <div className="flex gap-3">
                                            <Pill size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Medicamentos</p>
                                                <p className="text-sm text-zinc-700">{record.medications}</p>
                                            </div>
                                        </div>
                                    )}

                                    {record.evolution && (
                                        <div className="pl-7 pt-1">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Evolução</p>
                                            <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                {record.evolution}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-zinc-400">
                            <FileText size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhum registro encontrado para este paciente.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
