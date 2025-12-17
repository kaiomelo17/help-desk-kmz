import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Computer, HeadphonesIcon, Users, Package, TrendingUp, Clock, Wifi } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listEquipamentos } from '@/lib/api/equipamentos';
import { listChamados } from '@/lib/api/chamados';
import { listUsuarios } from '@/lib/api/usuarios';
import { listProdutos } from '@/lib/api/produtos';

const Dashboard = () => {
  const { data: equipamentos } = useQuery({ queryKey: ['equipamentos'], queryFn: listEquipamentos, staleTime: 30000 })
  const { data: chamados } = useQuery({ queryKey: ['chamados'], queryFn: listChamados, staleTime: 30000 })
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: listUsuarios, staleTime: 30000 })
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: listProdutos, staleTime: 30000 })
  const equipamentosCount = equipamentos?.length ?? 0
  const chamadosAbertos = (chamados ?? []).filter(c => c.status === 'Aberto' || c.status === 'Em Andamento').length
  const usuariosCount = usuarios?.length ?? 0
  const produtosCount = produtos?.length ?? 0
  const stats = [
    { title: 'Equipamentos', value: String(equipamentosCount), icon: Computer, change: '', changeType: 'positive' as const },
    { title: 'Chamados Abertos', value: String(chamadosAbertos), icon: HeadphonesIcon, change: '', changeType: 'positive' as const },
    { title: 'Usuários', value: String(usuariosCount), icon: Users, change: '', changeType: 'positive' as const },
    { title: 'Produtos', value: String(produtosCount), icon: Package, change: '', changeType: 'positive' as const },
  ];

  const recentTickets = (chamados ?? []).slice(0, 6).map(c => ({
    id: c.id,
    title: c.titulo,
    user: c.usuario,
    status: c.status,
    priority: c.prioridade,
    time: c.data || '',
  }))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto': return 'default';
      case 'Em Andamento': return 'default';
      case 'Concluído': return 'secondary';
      default: return 'default';
    }
  };

  const { user } = useAuth();
  const hasEmAndamento = (chamados ?? []).some(c => c.status === 'Em Andamento')
  const teamStatus = {
    label: 'Equipe de TI',
    state: hasEmAndamento ? 'Em serviço' : 'Disponível',
    icon: Wifi,
  };

  const equipamentosStatus = (() => {
    const rows = equipamentos ?? []
    const count = (s: string) => rows.filter(r => r.status === s).length
    const inativo = count('Inativo')
    const ativos = Math.max(0, rows.length - inativo)
    return {
      ativos,
      disponiveis: count('Disponível'),
      emUso: count('Em Uso'),
      manutencao: count('Manutenção'),
      inativo,
    }
  })()

  const servicosMetrics = (() => {
    const rows = chamados ?? []
    const hoje = new Date().toISOString().split('T')[0]
    const feitosHoje = rows.filter(r => r.data === hoje && r.status === 'Concluído').length
    const emAberto = rows.filter(r => r.status === 'Aberto').length
    const emAndamento = rows.filter(r => r.status === 'Em Andamento').length
    const tempoMinimoPorServico = '-' as string
    return { tempoMinimoPorServico, feitosHoje, emAberto, emAndamento }
  })()

  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={'outline'}
            onClick={() => navigate('/dashboard/equipamentos')}
          >
            Equipamentos
          </Button>
          <Button
            variant={'outline'}
            onClick={() => navigate('/dashboard/servicos')}
          >
            Serviços
          </Button>
        </div>
      </div>

      
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="p-3 flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-semibold">{stat.value}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success"></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="p-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{teamStatus.label}</CardTitle>
              <teamStatus.icon className="h-3 w-3 text-success" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base font-semibold">{teamStatus.state}</div>
              {user?.tier === 'vip' && (
                <div className="mt-1">
                  <Badge variant="default">VIP</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">Atendimento prioritário habilitado</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Chamados Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-primary/10 rounded-full p-1.5">
                        <HeadphonesIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">{ticket.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {ticket.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      

      
    </div>
  );
};

export default Dashboard;
