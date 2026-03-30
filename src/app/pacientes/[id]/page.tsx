"use client";

import { use, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Calendar, Mail, Phone, MapPin, User, FileText, Clock, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewPatientModal } from "@/components/NewPatientModal";
import { NewMedicalRecordModal } from "@/components/NewMedicalRecordModal";
import { cn } from "@/lib/utils";

interface PatientProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

function MedicalRecordItem({ record, onDelete }: { record: any; onDelete: (id: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="group relative bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(record.id);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Excluir prontuário"
            >
                <Trash2 size={18} />
            </button>

            <div className={cn("flex items-center justify-between", isExpanded && "mb-4 pb-4 border-b border-zinc-50")}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-zinc-900">
                            {format(new Date(record.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-zinc-500 uppercase font-medium tracking-wider">
                            {record.session_type || "Sessão"}
                        </p>
                    </div>
                </div>
                <div className="text-right mr-8">
                    <p className="text-xs text-zinc-400">Horário</p>
                    <p className="text-sm font-medium text-zinc-700">
                        {format(new Date(record.created_at), "HH:mm")}
                    </p>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {record.complaints && (
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Queixas</p>
                            <p className="text-zinc-700">{record.complaints}</p>
                        </div>
                    )}

                    {record.diagnosis && (
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Diagnóstico</p>
                            <p className="text-zinc-700 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg inline-block text-sm">
                                {record.diagnosis}
                            </p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Evolução</p>
                        <div className="bg-zinc-50 p-4 rounded-xl text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap border border-zinc-100">
                            {record.evolution || "Sem anotações de evolução."}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PatientProfilePage({ params }: PatientProfilePageProps) {
    const { id } = use(params);
    const [patient, setPatient] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRecordOpen, setIsRecordOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            // Fetch Patient Details
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);

            // Fetch Medical Records
            const { data: recordsData, error: recordsError } = await supabase
                .from('medical_records')
                .select('*')
                .eq('patient_id', id)
                .order('created_at', { ascending: false });

            if (recordsError) throw recordsError;
            setRecords(recordsData || []);

        } catch (error) {
            console.error("Erro ao carregar paciente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handlePatientUpdate = async (data: any) => {
        const supabase = createClient();
        console.log("Atualizando paciente:", data); // Debug log

        const { error } = await supabase.from('patients').update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            birth_date: data.birthDate,
            gender: data.gender,
            profession: data.profession,
            cpf: data.cpf,
            is_active: data.status === 'active' // Map status to is_active
        }).eq('id', id);

        if (error) {
            console.error("Erro ao atualizar paciente:", error);
            alert(`Erro ao atualizar paciente: ${error.message}`);
            return;
        }

        setIsEditOpen(false);
        fetchData();
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!confirm("Tem certeza que deseja remover este prontuário? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase.from('medical_records').delete().eq('id', recordId);

            if (error) throw error;

            setRecords(prev => prev.filter(r => r.id !== recordId));
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir prontuário.");
        }
    };


    if (loading) {
        return (
            <Shell>
                <div className="flex items-center justify-center h-full min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </Shell>
        );
    }

    if (!patient) {
        return (
            <Shell>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-zinc-900">Paciente não encontrado</h2>
                    <Link href="/pacientes" className="text-blue-500 hover:underline mt-2 inline-block">
                        Voltar para lista
                    </Link>
                </div>
            </Shell>
        );
    }

    const initials = patient.name.substring(0, 2).toUpperCase();

    return (
        <Shell>
            <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/pacientes" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-zinc-900">{patient.name}</h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.is_active === false
                                        ? 'bg-zinc-100 text-zinc-500'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {patient.is_active === false ? 'Inativo' : 'Ativo'}
                                    </span>
                                </div>
                                <p className="text-zinc-500">Cadastrado há {format(new Date(patient.created_at), "d 'dias'")} </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium transition-colors"
                        >
                            <Edit size={18} />
                            Editar Dados
                        </button>
                        <button
                            onClick={() => setIsRecordOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <FileText size={18} />
                            Novo Prontuário
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Personal Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <User size={20} className="text-blue-500" />
                                Dados Pessoais
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 text-zinc-600">
                                    <Mail size={18} className="mt-0.5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Email</p>
                                        <p className="text-sm font-medium">{patient.email || "Não informado"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-zinc-600">
                                    <Phone size={18} className="mt-0.5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Telefone</p>
                                        <p className="text-sm font-medium">{patient.phone || "Não informado"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-zinc-600">
                                    <Calendar size={18} className="mt-0.5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Nascimento</p>
                                        <p className="text-sm font-medium">
                                            {patient.birth_date
                                                ? format(new Date(patient.birth_date), "dd/MM/yyyy")
                                                : "Não informado"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-zinc-600">
                                    <User size={18} className="mt-0.5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">CPF</p>
                                        <p className="text-sm font-medium">{patient.cpf || "Não informado"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-zinc-600">
                                    <MapPin size={18} className="mt-0.5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs text-zinc-400">Endereço</p>
                                        <p className="text-sm font-medium text-zinc-500 italic">Endereço não cadastrado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Medical History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900">Histórico Clínico</h3>
                            <span className="text-sm text-zinc-500">{records.length} registros</span>
                        </div>

                        <div className="space-y-4">
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <MedicalRecordItem
                                        key={record.id}
                                        record={record}
                                        onDelete={handleDeleteRecord}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
                                    <FileText size={48} className="mx-auto mb-4 text-zinc-200" />
                                    <p className="text-zinc-500 font-medium">Nenhum prontuário registrado</p>
                                    <p className="text-sm text-zinc-400 mb-6">Inicie um atendimento para criar o primeiro registro.</p>
                                    <button
                                        onClick={() => setIsRecordOpen(true)}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Criar registro agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <NewPatientModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSubmit={handlePatientUpdate}
                    initialData={{
                        name: patient.name,
                        email: patient.email || "",
                        phone: patient.phone || "",
                        cpf: patient.cpf || "",
                        birthDate: patient.birth_date || "",
                        gender: patient.gender || "",
                        profession: patient.profession || "",
                        status: patient.is_active === false ? "inactive" : "active"
                    }}
                />

                <NewMedicalRecordModal
                    isOpen={isRecordOpen}
                    onClose={() => {
                        setIsRecordOpen(false);
                        fetchData(); // Refresh list after adding
                    }}
                    patientId={patient.id}
                    patientName={patient.name}
                />
            </div>
        </Shell>
    );
}
