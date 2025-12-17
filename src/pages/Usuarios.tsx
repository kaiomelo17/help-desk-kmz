import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Eye, PencilLine, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsuarios, createUsuario, updateUsuario, deleteUsuario, type Usuario } from '@/lib/api/usuarios';
import { listSetores, createSetor, type Setor as SetorType } from '@/lib/api/setores';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  nome: string;
  username: string;
  setor: string;
  password: string;
  tipo: 'vip' | 'padrao' | 'admin';
  isAdmin?: boolean;
}

const Usuarios = () => {
  const queryClient = useQueryClient()
  const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0' && !!supabase
  const navigate = useNavigate()
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const rows = await listUsuarios()
      return rows.map(r => ({
        id: r.id,
        nome: r.name || '',
        username: r.username || '',
        setor: r.setor || '',
        password: '',
        tipo: r.tier || 'padrao',
        isAdmin: r.is_admin === 1 || r.tier === 'admin'
      })) as User[]
    },
    staleTime: 1000 * 30,
  })
  const usuarios = (usuariosData ?? []) as User[]
  const { data: setoresData } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => await listSetores(),
    staleTime: 1000 * 60,
  })
  const setoresOptions = (setoresData ?? []).map((s: SetorType) => s.nome)

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    setor: '',
    password: '',
    tipo: 'padrao' as User['tipo'],
  });
  const [newSector, setNewSector] = useState({ nome: '' })

  const createMut = useMutation({
    mutationFn: async () => {
      return await createUsuario({ ...formData })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setFormData({ nome: '', username: '', setor: '', password: '', tipo: 'padrao' })
      setDialogOpen(false)
      toast.success('Usuário cadastrado com sucesso!')
    },
    onError: () => toast.error('Falha ao cadastrar usuário')
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate()
  }

  const filteredUsers = (usuarios ?? []).filter(user => {
    const st = (searchTerm || '').toLowerCase()
    return (user.nome || '').toLowerCase().includes(st) || (user.username || '').toLowerCase().includes(st)
  });

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({ nome: user.nome, username: user.username, setor: user.setor, password: '', tipo: user.tipo });
    setEditOpen(true);
  };

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<User> }) => {
      return await updateUsuario(id, {
        nome: input.nome,
        username: input.username,
        setor: input.setor,
        password: input.password,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setEditOpen(false)
      toast.success('Usuário atualizado')
    },
    onError: () => toast.error('Falha ao atualizar usuário')
  })
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return await deleteUsuario(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário excluído')
    },
    onError: () => toast.error('Falha ao excluir usuário')
  })
  const handleDelete = (id: string) => {
    deleteMut.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Usuário</Label>
                <Select value={formData.tipo} onValueChange={(value: User['tipo']) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Usuário de Acesso</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <div className="flex items-center gap-2">
                  <Select value={formData.setor} onValueChange={(value) => setFormData({ ...formData, setor: value })}>
                    <SelectTrigger id="setor">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {setoresOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" aria-label="Adicionar setor" onClick={() => setAddSectorOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={addSectorOpen} onOpenChange={setAddSectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Setor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const mut = createSetor({
                nome: newSector.nome,
              })
              Promise.resolve(mut)
                .then(async () => {
                  await queryClient.invalidateQueries({ queryKey: ['setores'] })
                  setFormData({ ...formData, setor: newSector.nome || formData.setor })
                  setNewSector({ nome: '' })
                  setAddSectorOpen(false)
                  toast.success('Setor cadastrado!')
                })
                .catch(() => toast.error('Falha ao cadastrar setor'))
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="ns-nome">Nome do Setor</Label>
              <Input id="ns-nome" value={newSector.nome} onChange={(e) => setNewSector({ ...newSector, nome: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">Cadastrar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent>
          <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow className="border-b border-b-[0.25px] border-input">
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input">
                  <TableCell className="flex items-center gap-2">
                    {user.nome}
                    {user.tipo === 'vip' && <Badge variant="default">VIP</Badge>}
                    {user.isAdmin && <Badge variant="destructive">ADMIN</Badge>}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.setor}</TableCell>
                  <TableCell>{(user.tipo || 'padrao').toUpperCase()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Visualizar" onClick={() => handleView(user)}>
                        <Eye />
                      </Button>
                      <Button size="icon" variant="secondary" aria-label="Editar" onClick={() => handleEdit(user)}>
                        <PencilLine />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Excluir" onClick={() => handleDelete(user.id)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 text-sm">
              <div>Nome: {selectedUser.nome}</div>
              <div>Usuário: {selectedUser.username}</div>
              <div>Setor: {selectedUser.setor}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedUser) return;
                updateMut.mutate({
                  id: selectedUser.id,
                  input: {
                    nome: formData.nome,
                    username: formData.username,
                    setor: formData.setor,
                    password: formData.password,
                  }
                })
              }}
              className="space-y-4"
            >
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuário</Label>
              <Input id="edit-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha</Label>
              <Input id="edit-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-setor">Setor</Label>
              <Select value={formData.setor} onValueChange={(value) => setFormData({ ...formData, setor: value })}>
                <SelectTrigger id="edit-setor">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setoresOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
