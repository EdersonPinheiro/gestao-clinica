import { Shell } from "@/components/Shell";
import { StatsCard } from "@/components/StatsCard";
import { SessionList } from "@/components/SessionList";
import { QuickAccess } from "@/components/QuickAccess";
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { getMonthlyRevenue } from "@/lib/efipay";

export default async function Home() {
  const supabase = await createClient();

  // Obter o usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  // Pegar o nome do usuário (do metadata ou do email)
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const firstName = fullName.split(' ')[0];
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Definir saudação baseada no fuso horário do Brasil
  const hourStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: 'numeric', hourCycle: 'h23' });
  const currentHour = parseInt(hourStr, 10);
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  // 1. Get today's appointments count
  const today = new Date().toISOString().split('T')[0];
  const { count: appointmentsToday } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('date_time', `${today}T00:00:00`)
    .lte('date_time', `${today}T23:59:59`);

  // 1.1 Get today's actual sessions for the list
  const { data: upcomingSessions } = await supabase
    .from('appointments')
    .select('*, patients(*)')
    .gte('date_time', `${today}T00:00:00`)
    .lte('date_time', `${today}T23:59:59`)
    .order('date_time', { ascending: true })
    .limit(3);

  // 2. Get total active patients
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  // 3. Get monthly revenue
  const monthlyRevenue = await getMonthlyRevenue();
  const formattedRevenue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(monthlyRevenue);

  return (
    <Shell>
      <div className="p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
            {greeting}, {capitalizedFirstName}<span className="text-2xl">👋</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm md:text-base">
            Aqui está o resumo do seu dia. Você tem <strong className="text-zinc-900">{appointmentsToday || 0} sessões</strong> agendadas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Sessões Hoje"
            value={String(appointmentsToday || 0)}
            subtext="Ver agenda completa"
            icon={Calendar}
            iconClassName="bg-blue-50 text-blue-600"
            href="/agenda"
          />
          <StatsCard
            title="Pacientes Cadastrados"
            value={String(totalPatients || 0)}

            href="/pacientes"
            icon={Users}
            iconClassName="bg-zinc-100 text-zinc-600"
          />
          <StatsCard
            title="Este Mês"
            value={formattedRevenue}
            subtext="Recebido via Pix"
            icon={DollarSign}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <StatsCard
            title="Taxa de Comparecimento"
            value="100%"
            trend="+0%"
            trendPositive={true}
            icon={TrendingUp}
            iconClassName="bg-zinc-100 text-zinc-900"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SessionList sessions={upcomingSessions || []} />
          </div>
          <div>
            <QuickAccess />
          </div>
        </div>
      </div>
    </Shell>
  );
}
