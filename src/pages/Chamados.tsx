import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'Aberto' | 'Em Andamento' | 'Concluído';
  usuario: string;
  data: string;
}

const Chamados = () => {
  const [chamados, setChamados] = useState<Ticket[]>([
    {
      id: '1',
      titulo: 'Impressora não funciona',
      descricao: 'A impressora do 2º andar não está respondendo',
      prioridade: 'alta',
      status: 'Em Andamento',
      usuario: 'João Silva',
      data: '2024-01-15',
    },
    {
      id: '2',
      titulo: 'Resetar senha',
      descricao: 'Preciso resetar minha senha do sistema',
      prioridade: 'media',
      status: 'Aberto',
      usuario: 'Maria Santos',
      data: '2024-01-15',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as Ticket['prioridade'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Date.now().toString(),
      ...formData,
      status: 'Aberto',
      usuario: 'Usuário Atual',
      data: new Date().toISOString().split('T')[0],
    };
    setChamados([newTicket, ...chamados]);
    setFormData({ titulo: '', descricao: '', prioridade: 'media' });
    setDialogOpen(false);
    toast.success('Chamado aberto com sucesso!');
  };

  const updateStatus = (id: string, newStatus: Ticket['status']) => {
    setChamados(chamados.map(c => c.id === id ? { ...c, status: newStatus } : c));
    toast.success('Status atualizado!');
  };

  const filteredTickets = chamados.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Chamados</h1>
          <p className="text-muted-foreground">Gerencie os chamados de suporte</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Chamado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value: Ticket['prioridade']) => setFormData({ ...formData, prioridade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Abrir Chamado</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chamados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Aberto">Aberto</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{ticket.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{ticket.descricao}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getPriorityColor(ticket.prioridade)}>
                    {ticket.prioridade}
                  </Badge>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Por: {ticket.usuario}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ticket.data}
                  </span>
                </div>
                <div className="flex gap-2">
                  {ticket.status !== 'Em Andamento' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(ticket.id, 'Em Andamento')}
                    >
                      Em Andamento
                    </Button>
                  )}
                  {ticket.status !== 'Concluído' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(ticket.id, 'Concluído')}
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Chamados;
