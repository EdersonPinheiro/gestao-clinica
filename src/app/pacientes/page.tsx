"use client";

import { Shell } from "@/components/Shell";
import { Search, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewPatientModal, type PatientFormData } from "@/components/NewPatientModal";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function PacientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Filter status state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply strict filtering
    if (filterStatus === 'active') {
      query = query.eq('is_active', true);
    } else if (filterStatus === 'inactive') {
      query = query.eq('is_active', false);
    }
    // If 'all', no filter on is_active

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching patients:", error);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }, [searchTerm, filterStatus]); // Add filterStatus to dependency

  // ... (useEffect and handleSavePatient remain the same) ...

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchPatients();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

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

      let error;

      // Create new
      const result = await supabase
        .from('patients')
        .insert(patientData);
      error = result.error;

      if (!error) {
        const { error: notifError } = await supabase.from("notifications").insert({
          title: "Novo Paciente Cadastrado",
          message: `Paciente ${data.name} foi cadastrado com sucesso.`,
          type: "info",
          read: false
        });

        if (notifError) {
          console.error("Erro ao criar notificação:", notifError);
        } else {
          // Force header update
          window.dispatchEvent(new Event('notification-updated'));
        }
      }

      if (error) throw error;

      fetchPatients(); // Reload list
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving patient:", error);
      alert("Erro ao salvar paciente.");
    }
  };

  const openNewPatientModal = () => {
    setIsModalOpen(true);
  };

  return (
    <Shell>
      <div className="p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Pacientes</h1>
            <p className="text-sm md:text-base text-zinc-500 mt-1">
              Gerencie seus pacientes e prontuários
            </p>
          </div>
          <button
            onClick={openNewPatientModal}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 w-full md:w-auto justify-center"
          >
            <Plus size={18} />
            Novo Paciente
          </button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Buscar pacientes..."
              className="h-11 w-full rounded-xl bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors w-full md:w-auto justify-center",
                isFilterOpen || filterStatus !== 'active' ? "bg-zinc-100 border-zinc-300 text-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              )}
            >
              <Filter size={18} />
              <span>Status: {filterStatus === 'all' ? 'Todos' : filterStatus === 'active' ? 'Ativos' : 'Inativos'}</span>
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white p-2 shadow-xl border border-zinc-100 z-20 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setFilterStatus('active'); setIsFilterOpen(false); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      filterStatus === 'active' ? "bg-blue-50 text-blue-600" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    Ativos
                    {filterStatus === 'active' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                  </button>
                  <button
                    onClick={() => { setFilterStatus('inactive'); setIsFilterOpen(false); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      filterStatus === 'inactive' ? "bg-blue-50 text-blue-600" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    Inativos
                    {filterStatus === 'inactive' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                  </button>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button
                    onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      filterStatus === 'all' ? "bg-blue-50 text-blue-600" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    Todos
                    {filterStatus === 'all' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table Section - Horizontal Scroll wrapper for mobile */}
        <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-zinc-50/50 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Última Sessão</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Carregando pacientes...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const initials = patient.name ? patient.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "??";

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => router.push(`/pacientes/${patient.id}`)}
                      className="group transition-colors hover:bg-zinc-50/50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold bg-blue-50 text-blue-600"
                            )}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {patient.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {/* Placeholder for session count until we do a join */}
                              - sessões
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-zinc-700">{patient.email || "Sem email"}</p>
                          <p className="text-zinc-500">{patient.phone || "Sem telefone"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700">
                        {/* Placeholder/Mock for last session */}
                        -
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            patient.is_active === false
                              ? "bg-zinc-100 text-zinc-500"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {patient.is_active === false ? 'Inativo' : 'Ativo'}
                        </span>
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      </div>

      <NewPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSavePatient}
        initialData={null}
      />
    </Shell>
  );
}
