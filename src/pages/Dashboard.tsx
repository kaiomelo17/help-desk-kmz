import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Computer, HeadphonesIcon, Users, Package, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const stats = [
    {
      title: 'Equipamentos',
      value: '156',
      icon: Computer,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Chamados Abertos',
      value: '23',
      icon: HeadphonesIcon,
      change: '-8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Usuários Ativos',
      value: '89',
      icon: Users,
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Produtos',
      value: '342',
      icon: Package,
      change: '+18%',
      changeType: 'positive' as const,
    },
  ];

  const recentTickets = [
    { id: 1, title: 'Impressora não funciona', user: 'João Silva', status: 'Em Andamento', priority: 'alta', time: '2h atrás' },
    { id: 2, title: 'Senha de acesso', user: 'Maria Santos', status: 'Aberto', priority: 'media', time: '4h atrás' },
    { id: 3, title: 'Computador lento', user: 'Pedro Costa', status: 'Aberto', priority: 'baixa', time: '5h atrás' },
    { id: 4, title: 'Instalação de software', user: 'Ana Lima', status: 'Concluído', priority: 'media', time: '1d atrás' },
  ];

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">{stat.change}</span>
                <span>vs. mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Chamados Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-primary/10 rounded-full p-2">
                    <HeadphonesIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">{ticket.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
