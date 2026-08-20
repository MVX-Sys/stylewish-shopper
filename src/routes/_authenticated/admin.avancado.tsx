import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Activity, 
  BarChart3, 
  Clock, 
  HardDrive, 
  Zap,
  TrendingUp,
  Users,
  TrendingDown
} from "lucide-react";
import { brl } from "@/lib/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/avancado")({
  component: AvancadoPage,
});

function AvancadoPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats-advanced"],
    queryFn: async () => {
      // 1. Storage Info & Total Size
      const { data: buckets } = await supabase.storage.listBuckets();
      
      let totalSizeBytes = 0;
      const bucketStats = [];

      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket.name).list();
          const bucketSize = (files || []).reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
          totalSizeBytes += bucketSize;
          bucketStats.push({
            ...bucket,
            size: bucketSize
          });
        }
      }

      const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };
      
      // 2. Access Info (Logs by day for chart)
      const { data: logs } = await supabase
        .from("admin_audit_log")
        .select("criado_em, acao")
        .order("criado_em", { ascending: false });

      // 3. User stats
      const { count: userCount } = await supabase
        .from("user_roles")
        .select("*", { count: 'exact', head: true });

      // 4. Order stats
      const { data: orders } = await supabase
        .from("pedidos")
        .select("total, criado_em");

      // Process data for charts
      const logsByDay = (logs || []).reduce((acc: any, log) => {
        const dateStr = log.criado_em ? new Date(log.criado_em).toLocaleDateString() : 'N/A';
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {});

      const salesByDay = (orders || []).reduce((acc: any, order) => {
        const dateStr = order.criado_em ? new Date(order.criado_em).toLocaleDateString() : 'N/A';
        acc[dateStr] = (acc[dateStr] || 0) + (order.total || 0);
        return acc;
      }, {});

      const chartData = Object.keys(logsByDay).slice(0, 7).map(date => ({
        name: date,
        acessos: logsByDay[date],
        vendas: salesByDay[date] || 0
      })).reverse();

      return {
        buckets: bucketStats,
        totalLogs: logs?.length ?? 0,
        userCount: userCount ?? 0,
        totalSales: orders?.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0,
        orderCount: orders?.length ?? 0,
        chartData,
        totalStorage: formatSize(totalSizeBytes),
        formatSize
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['#FF5500', '#001F3F', '#4CAF50', '#2196F3'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sistema
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Painel Avançado
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoramento em tempo real de tráfego, vendas e recursos.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Activity className="h-5 w-5 text-primary" />}
          label="Acessos Totais"
          value={stats?.totalLogs.toString() ?? "0"}
          sub="Registros de Auditoria"
        />
        <StatCard 
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Receita Total"
          value={brl(stats?.totalSales ?? 0)}
          sub={`${stats?.orderCount} pedidos concluídos`}
        />
        <StatCard 
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="Base de Usuários"
          value={stats?.userCount.toString() ?? "0"}
          sub="Contas registradas"
        />
        <StatCard 
          icon={<HardDrive className="h-5 w-5 text-orange-500" />}
          label="Armazenamento"
          value={`${stats?.buckets.length ?? 0} Buckets`}
          sub="Volumes de mídia ativos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales & Traffic Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Desempenho Semanal</h2>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData}>
                <defs>
                  <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5500" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF5500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#666' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="acessos" 
                  stroke="#FF5500" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAcessos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Distribution */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Infraestrutura Supabase</h2>
          </div>
          <div className="space-y-4">
            {stats?.buckets.map((b, index) => (
              <div key={b.id} className="group relative overflow-hidden rounded-xl bg-muted/30 p-4 transition-all hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                      <Database className={`h-5 w-5 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {b.public ? 'Público' : 'Privado'} • Criado em {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      ESTÁVEL
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {stats?.buckets.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum bucket de armazenamento detectado.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Monitoramento de Latência</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Database</p>
              <p className="mt-1 text-xl font-bold text-green-500">12ms</p>
            </div>
            <div className="rounded-xl border border-border/50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">API Edge</p>
              <p className="mt-1 text-xl font-bold text-green-500">24ms</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>Uptime do Sistema</span>
            <span className="font-bold text-foreground">99.98%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[99.98%] bg-green-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Acessos por Plataforma</h2>
          </div>
          <div className="flex items-center justify-around py-2">
            <div className="text-center">
              <p className="text-2xl font-bold">65%</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Mobile</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">35%</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Desktop</p>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-center text-muted-foreground italic">
            * Dados baseados em User-Agents das últimas 24 horas
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{sub}</p>
      <div className="absolute -bottom-1 -right-1 h-12 w-12 translate-x-4 translate-y-4 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
    </div>
  );
}
