"use client";

import { UserPlus, CalendarPlus, FileText, Receipt } from "lucide-react";
import { useState } from "react";
import { NewMedicalRecordModal } from "./NewMedicalRecordModal";
import { NewPatientModal, type PatientFormData } from "./NewPatientModal";
import { createClient } from "@/lib/supabase";

const actions = [
    {
        icon: UserPlus,
        label: "Novo Paciente",
        description: "Cadastrar novo paciente",
        bg: "bg-blue-50",
        color: "text-blue-600",
    },
    {
        icon: CalendarPlus,
        label: "Agendar Sessão",
        description: "Criar agendamento",
        bg: "bg-emerald-50",
        color: "text-emerald-600",
    },
    {
        icon: FileText,
        label: "Nova Anotação",
        description: "Registro de evolução",
        bg: "bg-sky-50",
        color: "text-sky-600",
    },
    {
        icon: Receipt,
        label: "Gerar Recibo",
        description: "Emitir comprovante",
        bg: "bg-amber-50",
        color: "text-amber-600",
    },
];

export function QuickAccess() {
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

    const handleActionClick = (label: string) => {
        if (label === "Agendar Sessão") {
            setIsSessionModalOpen(true);
        } else if (label === "Novo Paciente") {
            setIsPatientModalOpen(true);
        }
    };

    const handleSavePatient = async (data: PatientFormData) => {
        try {
            const supabase = createClient();

            // Validate duplication (CPF or Email)
            if (data.cpf || data.email) {
                let query = supabase.from('patients').select('id, name', { count: 'exact' });
                const conditions = [];

                if (data.cpf) conditions.push(`cpf.eq.${data.cpf}`);
                if (data.email) conditions.push(`email.eq.${data.email}`);

                if (conditions.length > 0) {
                    query = query.or(conditions.join(','));
                    const { data: existing } = await query;

                    if (existing && existing.length > 0) {
                        alert(`Já existe um paciente cadastrado com este CPF ou E-mail (${existing[0].name}).`);
                        return;
                    }
                }
            }

            const patientData = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                birth_date: data.birthDate,
                gender: data.gender,
                profession: data.profession,
                cpf: data.cpf,
                is_active: data.status === 'active' // Map 'active'/'inactive' to boolean
            };

            const { error } = await supabase.from('patients').insert(patientData);

            if (error) throw error;

            // Notification
            await supabase.from("notifications").insert({
                title: "Novo Paciente Cadastrado",
                message: `Paciente ${data.name} foi cadastrado com sucesso.`,
                type: "info",
                read: false
            });

            window.dispatchEvent(new Event('notification-updated'));

            alert("Paciente cadastrado com sucesso!");
            setIsPatientModalOpen(false);

            // Optionally redirect to patients list or refresh stats, but for now just close modal
        } catch (error) {
            console.error("Error saving patient:", error);
            alert("Erro ao salvar paciente.");
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-zinc-900">Acesso Rápido</h2>
                <div className="grid grid-cols-2 gap-4">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleActionClick(action.label)}
                            className={`flex flex-col items-start gap-4 rounded-xl p-4 text-left transition-transform hover:scale-[1.02] ${action.bg}`}
                        >
                            <div className={`rounded-lg p-2 ${action.color} bg-white/60`}>
                                <action.icon size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900">{action.label}</p>
                                <p className="text-xs text-zinc-500">{action.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <NewMedicalRecordModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
            />

            <NewPatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSubmit={handleSavePatient}
                initialData={null}
            />
        </>
    );
}
