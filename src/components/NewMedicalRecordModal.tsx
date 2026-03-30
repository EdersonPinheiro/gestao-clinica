"use client";

import { X, Save, FileText, Activity, Pill, Stethoscope, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface NewMedicalRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId?: string;
    patientName?: string;
    initialSessionType?: string;
    appointmentId?: string;
}

export function NewMedicalRecordModal({ isOpen, onClose, patientId, patientName, initialSessionType, appointmentId }: NewMedicalRecordModalProps) {
    const [loading, setLoading] = useState(false);

    // Form States
    const [complaints, setComplaints] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [medications, setMedications] = useState("");
    const [evolution, setEvolution] = useState("");
    const [sessionType, setSessionType] = useState(initialSessionType || "Presencial");

    // Dynamic Patient Selection
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
    const [patientsList, setPatientsList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter patients based on search
    const filteredPatients = searchTerm.trim() === "" ? [] : patientsList.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && !patientId) {
            const fetchPatients = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from('patients')
                    .select('id, name')
                    .eq('is_active', true)
                    .order('name');

                if (data) setPatientsList(data);
            };
            fetchPatients();
        }
    }, [isOpen, patientId]);

    // Update internal state if prop changes
    useEffect(() => {
        if (patientId) setSelectedPatientId(patientId);
    }, [patientId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalPatientId = patientId || selectedPatientId;

        if (!finalPatientId) {
            alert("Erro: Paciente não identificado. Por favor selecione um paciente.");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        try {
            // 1. Save Medical Record
            const { error: recordError } = await supabase.from('medical_records').insert({
                patient_id: finalPatientId,
                complaints,
                diagnosis,
                medications, // Optional field
                evolution,
                session_type: sessionType,
                date: new Date().toISOString(),
                // Link record to appointment if possible (optional normalization step for future)
                // appointment_id: appointmentId 
            });

            if (recordError) throw recordError;

            // 2. If launched from an appointment, mark appointment as completed
            if (appointmentId) {
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', appointmentId);

                if (updateError) {
                    console.error("Error updating appointment status:", updateError);
                    // We don't stop the flow because the record was saved, simple warning log
                }
            }

            // Success
            alert("Prontuário salvo e sessão finalizada!");

            // Allow parent to refresh or just close
            onClose();

            // Reset form
            setComplaints("");
            setDiagnosis("");
            setMedications("");
            setEvolution("");

        } catch (error) {
            console.error("Error saving record:", error);
            alert("Erro ao salvar prontuário.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex-none flex items-center justify-between p-6 border-b border-zinc-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <FileText className="text-blue-500" />
                            Novo Prontuário
                        </h2>
                        {!patientId ? (
                            <p className="text-sm text-zinc-500">
                                Selecione o paciente para iniciar o registro
                            </p>
                        ) : (
                            <p className="text-sm text-zinc-500">
                                Registro de sessão para <span className="font-semibold text-zinc-700">{patientName}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto bg-zinc-50/30">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Patient Selection (if not pre-selected) */}
                        {/* Patient Selection (if not pre-selected) */}
                        {!patientId && (
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-zinc-700">Paciente <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente..."
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                            // Reset selection if user keeps typing
                                            if (e.target.value === "") setSelectedPatientId("");
                                        }}
                                        onFocus={() => {
                                            if (searchTerm.trim() !== "") setIsDropdownOpen(true);
                                        }}
                                    />
                                    {isDropdownOpen && searchTerm.trim() !== "" && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-100 bg-white shadow-xl z-20">
                                                {filteredPatients.length > 0 ? (
                                                    filteredPatients.map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                                                            onClick={() => {
                                                                setSelectedPatientId(p.id);
                                                                setSearchTerm(p.name);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <p className="font-medium text-zinc-900">{p.name}</p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-zinc-500">
                                                        Nenhum paciente encontrado.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {selectedPatientId && searchTerm && (
                                    <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Paciente selecionado
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Session Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Tipo de Sessão</label>
                                {initialSessionType ? (
                                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 font-medium cursor-not-allowed">
                                        {initialSessionType}
                                        <span className="text-xs text-zinc-400 font-normal ml-2">(Definido no agendamento)</span>
                                    </div>
                                ) : (
                                    <select
                                        value={sessionType}
                                        onChange={(e) => setSessionType(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="Presencial">Presencial</option>
                                        <option value="Online">Online</option>
                                        <option value="Avaliação">Avaliação</option>
                                    </select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Activity size={16} className="text-orange-500" />
                                    Queixa Principal
                                </label>
                                <input
                                    type="text"
                                    value={complaints}
                                    onChange={(e) => setComplaints(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Ex: Ansiedade, Insônia..."
                                />
                            </div>
                        </div>

                        {/* Clinical Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2 mb-2">
                                    <Stethoscope size={16} className="text-purple-500" />
                                    Hipótese Diagnóstica
                                </label>
                                <textarea
                                    rows={3}
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-purple-500 resize-none"
                                    placeholder="Observações diagnósticas..."
                                />
                            </div>

                            <div className="space-y-2 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2 mb-2">
                                    <Pill size={16} className="text-green-500" />
                                    Uso de Medicações
                                </label>
                                <textarea
                                    rows={3}
                                    value={medications}
                                    onChange={(e) => setMedications(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500 resize-none"
                                    placeholder="Liste as medicações atuais..."
                                />
                            </div>
                        </div>

                        {/* Evolution - Main Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                <FileText size={16} className="text-blue-500" />
                                Evolução / Anotações da Sessão <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={10}
                                value={evolution}
                                onChange={(e) => setEvolution(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm"
                                placeholder="Descreva o andamento da sessão, intervenções realizadas e observações relevantes..."
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                            {!patientId && (
                                <p className="mr-auto text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={14} /> Selecione um paciente válido
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!patientId && !selectedPatientId) || !evolution}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Salvando..." : (
                                    <>
                                        <Save size={18} />
                                        Salvar Prontuário
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div >
            </div >
        </div >
    );
}
