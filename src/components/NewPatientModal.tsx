"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface NewPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PatientFormData) => void;
    initialData?: PatientFormData | null;
}

export interface PatientFormData {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    profession: string;
    status: string;
}

export function NewPatientModal({ isOpen, onClose, onSubmit, initialData }: NewPatientModalProps) {
    const [formData, setFormData] = useState<PatientFormData>({
        name: "",
        cpf: "",
        email: "",
        phone: "",
        birthDate: "",
        gender: "",
        profession: "",
        status: "active"
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: "",
                    cpf: "",
                    email: "",
                    phone: "",
                    birthDate: "",
                    gender: "",
                    profession: "",
                    status: "active"
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all animate-in slide-in-from-bottom-10 sm:fade-in sm:zoom-in-95 duration-200">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-100 sm:hidden mb-6" />

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-zinc-900">{initialData ? "Editar Paciente" : "Novo Paciente"}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                                Nome Completo
                            </label>
                            <input
                                required
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Ex: Maria Oliveira"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="cpf" className="text-sm font-medium text-zinc-700">
                                CPF
                            </label>
                            <input
                                required
                                type="text"
                                id="cpf"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                                E-mail
                            </label>
                            <input
                                required
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="exemplo@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="birthDate" className="text-sm font-medium text-zinc-700">
                                Data de Nascimento
                            </label>
                            <input
                                required
                                type="date"
                                id="birthDate"
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
                                Celular / WhatsApp
                            </label>
                            <input
                                required
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="gender" className="text-sm font-medium text-zinc-700">
                                Sexo
                            </label>
                            <select
                                required
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="" disabled>Selecione</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="profession" className="text-sm font-medium text-zinc-700">
                                Profissão
                            </label>
                            <input
                                type="text"
                                id="profession"
                                name="profession"
                                value={formData.profession}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Ex: Advogada"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="status" className="text-sm font-medium text-zinc-700">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            {initialData ? "Salvar Alterações" : "Cadastrar Paciente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
