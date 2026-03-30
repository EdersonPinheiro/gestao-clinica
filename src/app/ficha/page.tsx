"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, QrCode, Copy, Loader2, Calendar, Clock } from "lucide-react";

export default function FichaPublica() {
    const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<{ qrcode: string; imagemQrcode: string; txid: string; valor: string } | null>(null);
    const [tempPatientId, setTempPatientId] = useState<string | null>(null);
    const [tempAppointment, setTempAppointment] = useState<{ date: string; time: string } | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleCopyPix = () => {
        if (paymentData?.qrcode) {
            navigator.clipboard.writeText(paymentData.qrcode);
            alert("Código PIX copiado!");
        }
    };

    const checkPaymentStatus = async (txid: string) => {
        try {
            const response = await fetch(`/api/payment/check-status?txid=${txid}`);
            const data = await response.json();

            if (data.paid) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                completeAppointment();
            }
        } catch (error) {
            console.error("Erro ao verificar pagamento:", error);
        }
    };

    const completeAppointment = async () => {
        setLoading(true);
        try {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();

            if (!tempPatientId || !tempAppointment) throw new Error("Dados perdidos");

            // Combine data e hora
            const localDateTime = new Date(`${tempAppointment.date}T${tempAppointment.time}:00`);
            const isoDateTime = localDateTime.toISOString();

            const { error } = await supabase.from("appointments").insert({
                patient_id: tempPatientId,
                date_time: isoDateTime,
                type: 'presencial', // Default or add to form
                duration_minutes: 50, // Default
                status: "agendado", // Confirmed
                notes: "Agendamento via Ficha Pública (Pago)"
            });

            if (error) throw error;

            setStep('success');
        } catch (error) {
            console.error("Erro ao agendar:", error);
            alert("Pagamento confirmado, mas erro ao agendar. Entre em contato.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // Capture appointment data
        const appointmentDate = formData.get("appointment_date") as string;
        const appointmentTime = formData.get("appointment_time") as string;
        setTempAppointment({ date: appointmentDate, time: appointmentTime });

        try {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();

            const patientData = {
                name: formData.get("name") as string,
                profession: formData.get("profession") as string,
                birth_date: formData.get("birth_date") as string,
                gender: formData.get("gender") as string,
                phone: formData.get("phone") as string,
                email: formData.get("email") as string,
                cpf: formData.get("cpf") as string,
                address_zip: formData.get("address_zip") as string,
                address_full: formData.get("address_full") as string,
                emergency_contact_name: formData.get("emergency_contact_name") as string,
                emergency_contact_phone: formData.get("emergency_contact_phone") as string,
                emergency_contact2_name: formData.get("emergency_contact2_name") as string,
                emergency_contact2_phone: formData.get("emergency_contact2_phone") as string,
                allergies: formData.get("allergies") as string,
                medications: formData.get("medications") as string,
                main_complaint: formData.get("main_complaint") as string,
            };

            // 1. Create Patient
            const { data: stringData, error } = await supabase.from("patients").insert(patientData).select('id').single();
            if (error) throw error;

            const newPatientId = stringData.id;
            setTempPatientId(newPatientId);

            // 2. Generate PIX
            const pixResponse = await fetch('/api/payment/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cpf: patientData.cpf,
                    name: patientData.name,
                    value: "1.00" // Valor simbólico ou configurável
                })
            });

            if (!pixResponse.ok) throw new Error("Erro ao gerar PIX");

            const pixData = await pixResponse.json();
            setPaymentData(pixData);
            setStep('payment');

            // Start Polling
            pollingRef.current = setInterval(() => {
                checkPaymentStatus(pixData.txid);
            }, 3000); // Check every 3 seconds

        } catch (error) {
            console.error(error);
            alert("Erro ao processar. Verifique os dados e tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 'payment' && paymentData) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <QrCode size={32} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Pagamento PIX</h2>
                        <p className="text-zinc-500 mt-2">
                            Para confirmar seu agendamento, realize o pagamento de <span className="font-bold text-zinc-900">R$ {paymentData.valor}</span>
                        </p>
                    </div>

                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col items-center gap-4">
                        {/* Imagem do QR Code */}
                        <div className="w-64 h-64 bg-white p-2 rounded-xl shadow-sm">
                            <img src={paymentData.imagemQrcode} alt="QR Code Pix" className="w-full h-full object-contain" />
                        </div>

                        <div className="w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pix Copia e Cola</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={paymentData.qrcode}
                                    className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-600 font-mono truncate"
                                />
                                <button
                                    onClick={handleCopyPix}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    title="Copiar código"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Aguardando confirmação do pagamento...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900">Agendamento Confirmado!</h2>
                    <p className="text-zinc-500">
                        Seus dados foram registrados e o pagamento confirmado. Já consta em nossa agenda.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Preencher Novo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-zinc-900">Ficha do Paciente</h1>
                    <p className="mt-2 text-zinc-600">Preencha seus dados para agendar um atendimento</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100">
                    <div className="p-6 sm:p-8">
                        <form className="space-y-8" onSubmit={handleSubmit}>

                            {/* Section 2: Dados Pessoais */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                                    <span className="h-6 w-1 bg-green-500 rounded-full"></span>
                                    Dados Pessoais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-8 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Nome Completo</label>
                                        <input required name="name" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Profissão</label>
                                        <input name="profession" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Ex: Advogado" />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Data de Nascimento</label>
                                        <input required name="birth_date" type="date" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>

                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Sexo</label>
                                        <select name="gender" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                                            <option value="">Selecione</option>
                                            <option value="F">Feminino</option>
                                            <option value="M">Masculino</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Telefone</label>
                                        <input required name="phone" type="tel" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-6 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">E-mail</label>
                                        <input required name="email" type="email" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-6 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">CPF</label>
                                        <input name="cpf" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="000.000.000-00" />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">CEP</label>
                                        <input name="address_zip" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-8 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Endereço Completo</label>
                                        <input name="address_full" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-zinc-100" />

                            {/* Section 3: Contatos e Responsáveis */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                                    <span className="h-6 w-1 bg-amber-500 rounded-full"></span>
                                    Contatos de Emergência
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Nome Responsável 1 <span className="text-red-500">*</span></label>
                                        <input required name="emergency_contact_name" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Telefone 1 <span className="text-red-500">*</span></label>
                                        <input required name="emergency_contact_phone" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>

                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Nome Responsável 2</label>
                                        <input name="emergency_contact2_name" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Telefone 2</label>
                                        <input name="emergency_contact2_phone" type="text" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-zinc-100" />

                            {/* Section 4: Dados Clínicos Básicos */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                                    <span className="h-6 w-1 bg-purple-500 rounded-full"></span>
                                    Informações de Saúde
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Possui alergias? Quais?</label>
                                        <textarea name="allergies" rows={2} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" placeholder="Não possuo alergias conhecidas ou descreva..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Faz uso de medicações? Quais?</label>
                                        <textarea name="medications" rows={2} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" placeholder="Não / Sim: descreva..." />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-zinc-100" />

                            {/* Section 5: Detalhes */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                                    <span className="h-6 w-1 bg-pink-500 rounded-full"></span>
                                    Sobre o Atendimento
                                </h3>

                                {/* Adicionando Seleção de Data/Hora */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Data Preferencial</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                            <input
                                                required
                                                name="appointment_date"
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Horário Preferencial</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                            <input
                                                required
                                                name="appointment_time"
                                                type="time"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Qual o principal motivo da sua visita?</label>
                                    <textarea name="main_complaint" required rows={4} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" placeholder="Descreva brevemente o que você está sentindo ou buscando..." />
                                </div>
                            </section>

                            <div className="pt-4 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-8 py-3 rounded-xl text-base font-semibold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar e Pagar"
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-zinc-400">
                    <p>© 2026 Clínica Gestão. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
}
