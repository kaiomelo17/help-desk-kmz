import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Clock, Eye, PencilLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listChamados, createChamado, updateChamado, deleteChamado, type Chamado as ChamadoType } from '@/lib/api/chamados';
import { supabase } from '@/lib/supabase';
import { listSetores, type Setor as SetorType } from '@/lib/api/setores';
import { listUsuarios, createUsuario, type Usuario } from '@/lib/api/usuarios';

interface Ticket extends Omit<ChamadoType, 'tipo_servico' | 'is_vip'> {
  tipoServico: string;
  isVip?: boolean;
}

const Chamados = () => {
  const queryClient = useQueryClient()
  const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0' && !!supabase
  const { data: chamadosData } = useQuery({
    queryKey: ['chamados'],
    queryFn: async () => {
      const rows = await listChamados()
      return rows.map(r => ({
        ...r,
        tipoServico: r.tipo_servico,
        isVip: r.is_vip,
      })) as Ticket[]
    },
    staleTime: 1000 * 30,
  })
  const { data: setoresData } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => await listSetores(),
    staleTime: 1000 * 60,
  })
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => await listUsuarios(),
    staleTime: 1000 * 60,
  })
  const chamados = (chamadosData ?? []) as Ticket[]

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    solicitante: '',
    setor: '',
    tipoServico: '',
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin'
  const currentUserName = user?.name || user?.email || ''
  const setoresList = (setoresData ?? [])
    .map((s: SetorType) => ({ id: s.id, nome: (s.nome || '').toUpperCase() }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }))
  const solicitantesList = (usuariosData ?? []).map((u: Usuario) => ({ id: u.id, nome: u.name || u.username }))

  const [newUser, setNewUser] = useState({
    nome: '',
    username: '',
    setor: '',
    password: '',
    tipo: 'padrao' as 'padrao' | 'vip' | 'admin',
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        usuario: user?.name || user?.email || 'Usuário Atual',
        solicitante: formData.solicitante,
        setor: formData.setor,
        tipo_servico: formData.tipoServico,
        is_vip: user?.tier === 'vip',
        status: 'Aberto' as const,
        data: new Date().toISOString().split('T')[0],
        prioridade: 'media' as const,
      }
      return await createChamado(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chamados'] })
      setFormData({ titulo: '', descricao: '', solicitante: '', setor: '', tipoServico: '' })
      setDialogOpen(false)
      toast.success(user?.tier === 'vip' ? 'Chamado VIP aberto e priorizado!' : 'Chamado aberto com sucesso!')
    },
    onError: () => toast.error('Falha ao abrir chamado')
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate()
  }
  const canEditTicket = (t: Ticket) => {
    return (isAdmin || t.solicitante === currentUserName) && t.status !== 'Concluído'
  }
  useEffect(() => {
    if (dialogOpen) {
      const currName = currentUserName
      const currUser = (usuariosData ?? []).find((u: Usuario) => (u.name || u.username) === currName)
      setFormData(fd => ({
        ...fd,
        solicitante: currName || fd.solicitante,
        setor: (currUser?.setor || fd.setor).toUpperCase(),
      }))
    }
  }, [dialogOpen, usuariosData, currentUserName])

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ChamadoType> }) => {
      return await updateChamado(id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chamados'] })
      toast.success('Status atualizado!')
    },
    onError: () => toast.error('Falha ao atualizar chamado')
  })
  const updateStatus = (id: string, newStatus: Ticket['status']) => {
    updateMut.mutate({ id, input: { status: newStatus } })
  }

  const handleView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({ titulo: ticket.titulo, descricao: ticket.descricao, solicitante: ticket.solicitante, setor: ticket.setor, tipoServico: ticket.tipoServico })
    setViewOpen(true);
  };

  const handleEdit = (ticket: Ticket) => {
    if (!canEditTicket(ticket)) {
      toast.error('Você não tem permissão para editar este chamado')
      return
    }
    setSelectedTicket(ticket);
    setFormData({ titulo: ticket.titulo, descricao: ticket.descricao, solicitante: ticket.solicitante, setor: ticket.setor, tipoServico: ticket.tipoServico });
    setEditOpen(true);
  };

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return await deleteChamado(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chamados'] })
      toast.success('Chamado excluído')
    },
    onError: () => toast.error('Falha ao excluir chamado')
  })
  const handleDelete = (id: string) => {
    deleteMut.mutate(id)
  }

  const filteredTickets = chamados.filter(ticket => {
    if (ticket.status === 'Concluído') return false
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const orderedTickets = [...filteredTickets].sort((a, b) => (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0));

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

  const myTicketsAll = chamados.filter(t => t.solicitante === currentUserName)
  const myCounts = {
    aberto: myTicketsAll.filter(t => t.status === 'Aberto').length,
    andamento: myTicketsAll.filter(t => t.status === 'Em Andamento').length,
    concluido: myTicketsAll.filter(t => t.status === 'Concluído').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Abrir Chamado</h1>
          {isAdmin && <p className="text-muted-foreground">Gerencie os chamados de suporte</p>}
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
                <Label htmlFor="solicitante">Solicitante</Label>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Select value={formData.solicitante} onValueChange={(value) => {
                      const user = (usuariosData ?? []).find((u: Usuario) => (u.name || u.username) === value)
                      setFormData({
                        ...formData,
                        solicitante: value,
                        setor: (user?.setor || '').toUpperCase()
                      })
                    }}>
                      <SelectTrigger id="solicitante">
                        <SelectValue placeholder="Selecione o solicitante" />
                      </SelectTrigger>
                      <SelectContent>
                        {solicitantesList.map((opt) => (
                          <SelectItem key={opt.id} value={opt.nome}>{opt.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="outline" aria-label="Adicionar usuário" onClick={() => setAddUserOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Input id="solicitante" value={formData.solicitante} disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Input id="setor" value={formData.setor} disabled={!isAdmin} onChange={(e) => {
                  if (isAdmin) setFormData({ ...formData, setor: e.target.value })
                }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Serviço</Label>
                <Select value={formData.tipoServico} onValueChange={(value) => setFormData({ ...formData, tipoServico: value })}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                    <SelectItem value="Manutenção de Software">Manutenção de Software</SelectItem>
                    <SelectItem value="Instabilidade na Rede">Instabilidade na Rede</SelectItem>
                    <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button type="submit" className="w-full">Abrir Chamado</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Usuário</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const mut = createUsuario({
                nome: newUser.nome,
                username: newUser.username,
                setor: newUser.setor,
                password: newUser.password,
                tipo: newUser.tipo,
              })
              Promise.resolve(mut)
                .then(async (u) => {
                  await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
                  setFormData({ ...formData, solicitante: newUser.nome || newUser.username, setor: (newUser.setor || formData.setor).toUpperCase() })
                  setNewUser({ nome: '', username: '', setor: '', password: '', tipo: 'padrao' })
                  setAddUserOpen(false)
                  toast.success('Usuário cadastrado!')
                })
                .catch(() => toast.error('Falha ao cadastrar usuário'))
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="nu-nome">Nome Completo</Label>
              <Input id="nu-nome" value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nu-username">Usuário</Label>
                <Input id="nu-username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nu-tipo">Tipo</Label>
                <Select value={newUser.tipo} onValueChange={(v: 'padrao' | 'vip' | 'admin') => setNewUser({ ...newUser, tipo: v })}>
                  <SelectTrigger id="nu-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nu-setor">Setor</Label>
                <Select value={newUser.setor} onValueChange={(value) => setNewUser({ ...newUser, setor: value })}>
                  <SelectTrigger id="nu-setor">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {setoresList.map((s) => (
                      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-password">Senha</Label>
              <Input id="nu-password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">Cadastrar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {isAdmin && (
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
            </SelectContent>
          </Select>
        </div>
      )}

      {isAdmin ? (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow className="border-b border-b-[0.25px] border-input">
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="odd:bg-muted/40 even:bg-card hover:bg-muted border-b border-b-[0.25px] border-input"
                    onDoubleClick={() => handleView(ticket)}
                  >
                    <TableCell className="truncate max-w-[280px]">{ticket.titulo}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(ticket.prioridade)}>{ticket.prioridade}</Badge>
                      {ticket.isVip && <Badge variant="default">VIP</Badge>}
                    </TableCell>
                    <TableCell><Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge></TableCell>
                    <TableCell>{ticket.solicitante}</TableCell>
                    <TableCell className="flex items-center gap-1"><Clock className="h-3 w-3" />{ticket.data}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Meus Chamados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
                <TableHeader>
                  <TableRow className="border-b border-b-[0.25px] border-input">
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTicketsAll.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="odd:bg-muted/40 even:bg-card hover:bg-muted border-b border-b-[0.25px] border-input"
                      onDoubleClick={() => handleView(ticket)}
                    >
                      <TableCell className="truncate max-w-[280px]">{ticket.titulo}</TableCell>
                      <TableCell><Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge></TableCell>
                      <TableCell className="flex items-center gap-1"><Clock className="h-3 w-3" />{ticket.data}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">Fila de Chamados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
                <TableHeader>
                  <TableRow className="border-b border-b-[0.25px] border-input">
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input"
                      onDoubleClick={() => handleView(ticket)}
                    >
                      <TableCell className="truncate max-w-[280px]">{ticket.titulo}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(ticket.prioridade)}>{ticket.prioridade}</Badge>
                        {ticket.isVip && <Badge variant="default">VIP</Badge>}
                      </TableCell>
                      <TableCell><Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge></TableCell>
                      <TableCell>{ticket.solicitante}</TableCell>
                      <TableCell className="flex items-center gap-1"><Clock className="h-3 w-3" />{ticket.data}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Chamado</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedTicket) return;
                if (!canEditTicket(selectedTicket)) return;
                updateMut.mutate({
                  id: selectedTicket.id,
                  input: { descricao: formData.descricao }
                })
                setViewOpen(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="view-titulo">Título</Label>
                <Input id="view-titulo" value={formData.titulo} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-solicitante">Solicitante</Label>
                <Input id="view-solicitante" value={formData.solicitante} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-setor">Setor</Label>
                <Input id="view-setor" value={formData.setor} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-tipo">Tipo de Serviço</Label>
                <Input id="view-tipo" value={formData.tipoServico} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-descricao">Descrição</Label>
                <Textarea id="view-descricao" rows={4} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} disabled={!canEditTicket(selectedTicket)} />
              </div>
              {canEditTicket(selectedTicket) && (
                <Button type="submit" className="w-full">Salvar</Button>
              )}
            </form>
          )}
          {selectedTicket && (
            <div className="flex flex-wrap gap-2 pt-2">
              {isAdmin && (
                <>
                  {selectedTicket.status !== 'Em Andamento' && (
                    <Button variant="outline" onClick={() => updateStatus(selectedTicket.id, 'Em Andamento')}>Em Andamento</Button>
                  )}
                  {selectedTicket.status !== 'Concluído' && (
                    <Button onClick={() => updateStatus(selectedTicket.id, 'Concluído')}>Concluir</Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDelete(selectedTicket.id)}>Excluir</Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chamado</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedTicket) return;
              updateMut.mutate({
                id: selectedTicket.id,
                input: {
                  titulo: formData.titulo,
                  descricao: formData.descricao,
                  solicitante: formData.solicitante,
                  setor: formData.setor,
                  tipo_servico: formData.tipoServico,
                }
              })
              setEditOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título</Label>
              <Input id="edit-titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea id="edit-descricao" rows={4} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-solicitante">Solicitante</Label>
              <Input id="edit-solicitante" value={formData.solicitante} disabled={!isAdmin} onChange={(e) => {
                if (isAdmin) setFormData({ ...formData, solicitante: e.target.value })
              }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-setor">Setor</Label>
              <Input id="edit-setor" value={formData.setor} disabled={!isAdmin} onChange={(e) => {
                if (isAdmin) setFormData({ ...formData, setor: e.target.value })
              }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Serviço</Label>
              <Input id="edit-tipo" value={formData.tipoServico} onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chamados;
