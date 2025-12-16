import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Printer, FileText, Eye, PencilLine, Trash2 } from 'lucide-react';
import { LOGO_SRC } from '@/config/branding';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEquipamentos, createEquipamento, updateEquipamento, deleteEquipamento, type Equipamento as EquipamentoType } from '@/lib/api/equipamentos';
import { listSetores, type Setor as SetorType } from '@/lib/api/setores';
import { supabase } from '@/lib/supabase';

interface Equipment extends EquipamentoType {}

const Equipamentos = () => {
  const queryClient = useQueryClient()
  const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0' && !!supabase
  const { data: equipamentosData } = useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      if (!supabaseEnabled) return await listEquipamentos()
      return await listEquipamentos()
    },
    staleTime: 1000 * 30,
  })
  const equipamentos = (equipamentosData ?? []) as Equipment[]
  const { data: setoresData } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => await listSetores(),
    staleTime: 1000 * 60,
  })
  const setoresOptions = (setoresData ?? []).map((s: SetorType) => s.nome)

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    patrimonio: '',
    marca: '',
    modelo: '',
    status: 'Disponível' as Equipment['status'],
    usuario: '',
    setor: '',
    ram: '',
    armazenamento: '',
    processador: '',
    polegadas: '',
    ghz: '',
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return await createEquipamento({ ...formData })
    },
    onSuccess: async (created) => {
      queryClient.setQueryData(['equipamentos'], (prev: any) => {
        const arr = Array.isArray(prev) ? prev : []
        return [created, ...arr]
      })
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      setFormData({ nome: '', tipo: '', patrimonio: '', marca: '', modelo: '', status: 'Disponível', usuario: '', setor: '', ram: '', armazenamento: '', processador: '', polegadas: '', ghz: '' })
      setDialogOpen(false)
      toast.success('Equipamento cadastrado com sucesso!')
    },
    onError: (err: any) => toast.error(typeof err?.message === 'string' ? err.message : 'Falha ao cadastrar equipamento')
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo) {
      toast.error('Selecione o tipo do equipamento')
      return
    }
    if (!formData.patrimonio) {
      toast.error('Informe o número de patrimônio')
      return
    }
    const dup = equipamentos.some((eq) => (eq.patrimonio || '').trim().toLowerCase() === formData.patrimonio.trim().toLowerCase())
    if (dup) {
      toast.error('Número de patrimônio já cadastrado')
      return
    }
    createMut.mutate()
  }

  const filteredEquipments = equipamentos.filter(eq =>
    eq.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.patrimonio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'Disponível': return 'default';
      case 'Em Uso': return 'default';
      case 'Manutenção': return 'destructive';
      case 'Inativo': return 'secondary';
    }
  };

  const handlePrintTerm = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setTermDialogOpen(true);
  };

  const handleView = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setViewOpen(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({ nome: equipment.nome, tipo: equipment.tipo, patrimonio: equipment.patrimonio, status: equipment.status, usuario: equipment.usuario || '', setor: equipment.setor || '' });
    setEditOpen(true);
  };

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Equipment> }) => {
      return await updateEquipamento(id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      setEditOpen(false)
      toast.success('Equipamento atualizado')
    },
    onError: () => toast.error('Falha ao atualizar equipamento')
  })
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return await deleteEquipamento(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      toast.success('Equipamento excluído')
    },
    onError: () => toast.error('Falha ao excluir equipamento')
  })
  const handleDelete = (id: string) => {
    deleteMut.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Gestão de Ativos</h1>
          <p className="text-muted-foreground">Gerencie os ativos da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[60vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Equipamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Equipamento</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notebook">Notebook</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Impressora">Impressora</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Smartphone">Smartphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patrimonio">Número de Patrimônio</Label>
                <Input
                  id="patrimonio"
                  value={formData.patrimonio}
                  onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário Responsável</Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
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
              </div>
              {['Desktop','Notebook'].includes(formData.tipo) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ram">Memória RAM</Label>
                    <Input id="ram" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="armazenamento">Armazenamento SSD/HDD</Label>
                    <Input id="armazenamento" value={formData.armazenamento} onChange={(e) => setFormData({ ...formData, armazenamento: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processador">Processador</Label>
                    <Input id="processador" value={formData.processador} onChange={(e) => setFormData({ ...formData, processador: e.target.value })} required />
                  </div>
                </>
              )}
              {formData.tipo === 'Monitor' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="polegadas">Polegadas</Label>
                    <Input id="polegadas" value={formData.polegadas} onChange={(e) => setFormData({ ...formData, polegadas: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ghz">GHz</Label>
                    <Input id="ghz" value={formData.ghz} onChange={(e) => setFormData({ ...formData, ghz: e.target.value })} required />
                  </div>
                </>
              )}
              {formData.tipo === 'Smartphone' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ram2">Memória RAM</Label>
                    <Input id="ram2" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="armazenamento2">Armazenamento</Label>
                    <Input id="armazenamento2" value={formData.armazenamento} onChange={(e) => setFormData({ ...formData, armazenamento: e.target.value })} required />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Equipment['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell>{equipment.nome}</TableCell>
                  <TableCell>{equipment.tipo}</TableCell>
                  <TableCell>{equipment.patrimonio}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(equipment.status)}>{equipment.status}</Badge>
                  </TableCell>
                  <TableCell>{equipment.usuario || '-'}</TableCell>
                  <TableCell>{equipment.setor || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Visualizar" onClick={() => handleView(equipment)}>
                        <Eye />
                      </Button>
                      <Button size="icon" variant="secondary" aria-label="Editar" onClick={() => handleEdit(equipment)}>
                        <PencilLine />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Excluir" onClick={() => handleDelete(equipment.id)}>
                        <Trash2 />
                      </Button>
                      <Button size="icon" variant="outline" aria-label="Termo" onClick={() => handlePrintTerm(equipment)}>
                        <FileText />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Termo de Responsabilidade Dialog */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termo de Responsabilidade</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-6 p-8 bg-white text-black border border-gray-300 rounded-md" id="termo-responsabilidade">
              <div className="flex items-center justify-center pb-6 border-b border-emerald-500">
                <img src={LOGO_SRC} alt="Concrem" className="h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">TERMO DE RESPONSABILIDADE DE {selectedEquipment.tipo}</h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  CONCREM INDUSTRIAL LTDA, com matriz no endereço Rodovia BR 010, s/n° / KM 31, inscrita no CNPJ sob o n° 18.543.638/0001-34, neste ato, entrega de {selectedEquipment.tipo} marca: {selectedEquipment.marca || '-'} modelo: {selectedEquipment.modelo || '-'} ESPECIFICAÇÕES: {(() => {
                    const e = selectedEquipment as any
                    const arr: string[] = []
                    if (['Desktop','Notebook','Smartphone'].includes(e.tipo)) {
                      if (e.ram) arr.push(`Memória RAM: ${e.ram}`)
                      if (e.armazenamento) arr.push(`Armazenamento: ${e.armazenamento}`)
                    }
                    if (['Desktop','Notebook'].includes(e.tipo)) {
                      if (e.processador) arr.push(`Processador: ${e.processador}`)
                    }
                    if (e.tipo === 'Monitor') {
                      if (e.polegadas) arr.push(`Polegadas: ${e.polegadas}`)
                      if (e.ghz) arr.push(`GHz: ${e.ghz}`)
                    }
                    return arr.length ? arr.join(' • ') : '-'
                  })()}, ao funcionário {selectedEquipment.usuario || '-'}, doravante denominado simplesmente "USUÁRIO", sob as seguintes condições:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Uso Exclusivo: O equipamento deverá ser utilizado ÚNICA e EXCLUSIVAMENTE a serviço da empresa, tendo em vista a atividade a ser exercida pelo USUÁRIO.</li>
                  <li>Responsabilidade: O USUÁRIO será responsável pelo uso e conservação do equipamento.</li>
                  <li>Detenção e Propriedade: O USUÁRIO detém apenas a posse do equipamento para a prestação de serviços profissionais e não a propriedade do mesmo. É terminantemente proibido o empréstimo, aluguel ou cessão deste a terceiros.</li>
                  <li>Devolução: Ao término da prestação de serviço ou do contrato individual de trabalho, o USUÁRIO compromete-se a devolver o equipamento em perfeito estado, no mesmo dia em que for comunicado ou comunique seu desligamento, considerando o desgaste natural pelo uso normal do equipamento.</li>
                </ol>
                <div className="flex justify-between pt-4">
                  <span>Dom Eliseu / {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>Setor: {selectedEquipment.setor || '-'}</span>
                </div>
                <div className="mt-8 pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="h-px bg-gray-400" />
                      <p className="text-center mt-3">Assinatura do Responsável</p>
                    </div>
                    <div>
                      <div className="h-px bg-gray-400" />
                      <p className="text-center mt-3">CPF do Responsável</p>
                    </div>
                  </div>
                  <p className="text-center mt-4">Nome: {selectedEquipment.usuario || '-'}</p>
                </div>
              </div>
              <div className="text-center text-xs mt-6 opacity-80">
                Rod. BR-010, Km 31, Interior - Cep 68653-000 Dom Eliseu-PA - Tel: (94) 98114-2020 • CNPJ: 18.543.638/0001-34 • IE: 15.417.865-9
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={() => setTermDialogOpen(false)} className="flex-1">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Equipamento</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-2 text-sm">
              <div>Nome: {selectedEquipment.nome}</div>
              <div>Tipo: {selectedEquipment.tipo}</div>
              <div>Patrimônio: {selectedEquipment.patrimonio}</div>
              <div>Marca: {selectedEquipment.marca || '-'}</div>
              <div>Modelo: {selectedEquipment.modelo || '-'}</div>
              <div>Status: {selectedEquipment.status}</div>
              <div>Usuário: {selectedEquipment.usuario || '-'}</div>
              <div>Setor: {selectedEquipment.setor || '-'}</div>
              {['Desktop','Notebook','Smartphone'].includes(selectedEquipment.tipo) && (
                <>
                  <div>RAM: {selectedEquipment.ram || '-'}</div>
                  <div>Armazenamento: {selectedEquipment.armazenamento || '-'}</div>
                </>
              )}
              {['Desktop','Notebook'].includes(selectedEquipment.tipo) && (
                <div>Processador: {selectedEquipment.processador || '-'}</div>
              )}
              {selectedEquipment.tipo === 'Monitor' && (
                <>
                  <div>Polegadas: {selectedEquipment.polegadas || '-'}</div>
                  <div>GHz: {selectedEquipment.ghz || '-'}</div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[60vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedEquipment) return;
              updateMut.mutate({ id: selectedEquipment.id, input: { ...formData } })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Input id="edit-tipo" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patrimonio">Patrimônio</Label>
              <Input id="edit-patrimonio" value={formData.patrimonio} onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-marca">Marca</Label>
              <Input id="edit-marca" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-modelo">Modelo</Label>
              <Input id="edit-modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-usuario">Usuário</Label>
              <Input id="edit-usuario" value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} />
            </div>
            {['Desktop','Notebook'].includes(formData.tipo) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-ram">Memória RAM</Label>
                  <Input id="edit-ram" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-armazenamento">Armazenamento SSD/HDD</Label>
                  <Input id="edit-armazenamento" value={formData.armazenamento} onChange={(e) => setFormData({ ...formData, armazenamento: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-processador">Processador</Label>
                  <Input id="edit-processador" value={formData.processador} onChange={(e) => setFormData({ ...formData, processador: e.target.value })} />
                </div>
              </>
            )}
            {formData.tipo === 'Monitor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-polegadas">Polegadas</Label>
                  <Input id="edit-polegadas" value={formData.polegadas} onChange={(e) => setFormData({ ...formData, polegadas: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ghz">GHz</Label>
                  <Input id="edit-ghz" value={formData.ghz} onChange={(e) => setFormData({ ...formData, ghz: e.target.value })} />
                </div>
              </>
            )}
            {formData.tipo === 'Smartphone' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-ram2">Memória RAM</Label>
                  <Input id="edit-ram2" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-armazenamento2">Armazenamento</Label>
                  <Input id="edit-armazenamento2" value={formData.armazenamento} onChange={(e) => setFormData({ ...formData, armazenamento: e.target.value })} />
                </div>
              </>
            )}
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
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Equipment['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em Uso">Em Uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
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

export default Equipamentos;
