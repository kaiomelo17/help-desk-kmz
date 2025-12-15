import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Building2, User, Phone, MapPin, Eye, PencilLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSetores, createSetor, updateSetor, deleteSetor, type Setor as SetorType } from '@/lib/api/setores';
import { supabase } from '@/lib/supabase';

interface Sector extends SetorType {}

const Setores = () => {
  const queryClient = useQueryClient()
  const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0' && !!supabase
  const { data: setoresData } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => {
      return await listSetores()
    },
    staleTime: 1000 * 30,
  })
  const setores = (setoresData ?? []) as Sector[]

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    responsavel: '',
    ramal: '',
    localizacao: '',
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return await createSetor({ ...formData })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['setores'] })
      setFormData({ nome: '', responsavel: '', ramal: '', localizacao: '' })
      setDialogOpen(false)
      toast.success('Setor cadastrado com sucesso!')
    },
    onError: () => toast.error('Falha ao cadastrar setor')
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate()
  }

  const filteredSectors = setores.filter(sector =>
    sector.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (sector: Sector) => {
    setSelectedSector(sector);
    setViewOpen(true);
  };

  const handleEdit = (sector: Sector) => {
    setSelectedSector(sector);
    setFormData({ nome: sector.nome, responsavel: sector.responsavel, ramal: sector.ramal, localizacao: sector.localizacao });
    setEditOpen(true);
  };

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Sector> }) => {
      return await updateSetor(id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['setores'] })
      setEditOpen(false)
      toast.success('Setor atualizado')
    },
    onError: () => toast.error('Falha ao atualizar setor')
  })
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSetor(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['setores'] })
      toast.success('Setor excluído')
    },
    onError: () => toast.error('Falha ao excluir setor')
  })
  const handleDelete = (id: string) => {
    deleteMut.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Setores</h1>
          <p className="text-muted-foreground">Gerencie os setores da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Setor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Setor</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  value={formData.ramal}
                  onChange={(e) => setFormData({ ...formData, ramal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar setores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setor</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Ramal</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="flex items-center gap-2"><Building2 className="h-4 w-4" />{sector.nome}</TableCell>
                  <TableCell>{sector.responsavel}</TableCell>
                  <TableCell>{sector.ramal}</TableCell>
                  <TableCell>{sector.localizacao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Visualizar" onClick={() => handleView(sector)}>
                        <Eye />
                      </Button>
                      <Button size="icon" variant="secondary" aria-label="Editar" onClick={() => handleEdit(sector)}>
                        <PencilLine />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Excluir" onClick={() => handleDelete(sector.id)}>
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
            <DialogTitle>Detalhes do Setor</DialogTitle>
          </DialogHeader>
          {selectedSector && (
            <div className="space-y-2 text-sm">
              <div>Setor: {selectedSector.nome}</div>
              <div>Responsável: {selectedSector.responsavel}</div>
              <div>Ramal: {selectedSector.ramal}</div>
              <div>Localização: {selectedSector.localizacao}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedSector) return;
              updateMut.mutate({ id: selectedSector.id, input: { ...formData } })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-responsavel">Responsável</Label>
              <Input id="edit-responsavel" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ramal">Ramal</Label>
              <Input id="edit-ramal" value={formData.ramal} onChange={(e) => setFormData({ ...formData, ramal: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-localizacao">Localização</Label>
              <Input id="edit-localizacao" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Setores;
