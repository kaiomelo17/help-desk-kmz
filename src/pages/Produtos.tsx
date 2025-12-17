import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Eye, PencilLine, Trash2, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProdutos, createProduto, updateProduto, deleteProduto, registrarSaida, listSaidas, updateSaida, deleteSaida, type Produto, type ProdutoSaida } from '@/lib/api/produtos';
import { supabase } from '@/lib/supabase';

type Product = Produto;

const Produtos = () => {
  const queryClient = useQueryClient()
  const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0' && !!supabase
  const { data: produtosData } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      if (!supabaseEnabled) return []
      return await listProdutos()
    },
    staleTime: 1000 * 30,
  })
  const produtos = useMemo<Product[]>(() => (produtosData ?? []), [produtosData])

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saidaOpen, setSaidaOpen] = useState(false);
  const { data: saidasData } = useQuery({
    queryKey: ['produto_saidas'],
    queryFn: async () => {
      if (!supabaseEnabled) return []
      return await listSaidas()
    },
    staleTime: 1000 * 30,
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    descricao: '',
    estoque: 0,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!supabaseEnabled) throw new Error('Supabase indisponível')
      return await createProduto({ ...formData })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setFormData({ nome: '', categoria: '', descricao: '', estoque: 0 })
      setDialogOpen(false)
      toast.success('Produto cadastrado com sucesso!')
    },
    onError: (err: unknown) => {
      const msg = typeof (err as { message?: unknown })?.message === 'string' ? (err as { message: string }).message : 'Falha ao cadastrar produto'
      toast.error(msg)
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate()
  }

  const filteredProducts = produtos.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ nome: product.nome, categoria: product.categoria, descricao: product.descricao, estoque: product.estoque });
    setEditOpen(true);
  };

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Product> }) => {
      if (!supabaseEnabled) throw new Error('Supabase indisponível')
      return await updateProduto(id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setEditOpen(false)
      toast.success('Produto atualizado')
    },
    onError: () => {
      toast.error('Falha ao atualizar produto')
    },
  })
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseEnabled) throw new Error('Supabase indisponível')
      return await deleteProduto(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto excluído')
    },
    onError: () => {
      toast.error('Falha ao excluir produto')
    },
  })
  const handleDelete = (id: string) => {
    deleteMut.mutate(id)
  }

  const [saidaQty, setSaidaQty] = useState<number>(0);
  const [saidaDestinatario, setSaidaDestinatario] = useState<string>('');
  const [saidaData, setSaidaData] = useState<string>('');
  const [saidaEditOpen, setSaidaEditOpen] = useState(false)
  const [selectedSaida, setSelectedSaida] = useState<ProdutoSaida | null>(null)
  const [saidaEditForm, setSaidaEditForm] = useState({ quantidade: 1, destinatario: '', data: '' })
  const handleSaida = (product: Product) => {
    setSelectedProduct(product);
    setSaidaOpen(true);
    setSaidaQty(0);
    setSaidaDestinatario('');
    setSaidaData('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o estoque de produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Periféricos">Periféricos</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Notebook">Notebook</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Impressora">Impressora</SelectItem>
                    <SelectItem value="Smartphone">Smartphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque">Quantidade em Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) })}
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
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
          <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow className="border-b border-b-[0.25px] border-input">
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input">
                  <TableCell>{product.nome}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>
                    <Badge variant={product.estoque > 10 ? 'default' : 'destructive'}>{product.estoque}</Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-[280px]">{product.descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Visualizar" onClick={() => handleView(product)}>
                        <Eye />
                      </Button>
                      <Button size="icon" variant="secondary" aria-label="Editar" onClick={() => handleEdit(product)}>
                        <PencilLine />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Excluir" onClick={() => handleDelete(product.id)}>
                        <Trash2 />
                      </Button>
                      <Button size="icon" variant="outline" aria-label="Registrar Saída" onClick={() => handleSaida(product)}>
                        <MinusCircle />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-2 text-sm">
              <div>Nome: {selectedProduct.nome}</div>
              <div>Categoria: {selectedProduct.categoria}</div>
              <div>Estoque: {selectedProduct.estoque}</div>
              <div>Descrição: {selectedProduct.descricao}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedProduct) return
              updateMut.mutate({ id: selectedProduct.id, input: { ...formData } })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                <SelectTrigger id="edit-categoria">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Periféricos">Periféricos</SelectItem>
                  <SelectItem value="Desktop">Desktop</SelectItem>
                  <SelectItem value="Notebook">Notebook</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Impressora">Impressora</SelectItem>
                  <SelectItem value="Smartphone">Smartphone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-estoque">Estoque</Label>
              <Input id="edit-estoque" type="number" value={formData.estoque} onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea id="edit-descricao" rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={saidaOpen} onOpenChange={setSaidaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Saída</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qty = Math.max(0, Math.floor(saidaQty));
                if (qty <= 0) {
                  toast.error('Informe uma quantidade válida');
                  return;
                }
                if (!selectedProduct) return
                registrarSaida(selectedProduct.id, qty, saidaDestinatario, saidaData || undefined)
                  .then(async () => {
                    await queryClient.invalidateQueries({ queryKey: ['produtos'] })
                    await queryClient.invalidateQueries({ queryKey: ['produto_saidas'] })
                    setSaidaOpen(false)
                    toast.success('Saída registrada e estoque atualizado')
                  })
                  .catch(() => {
                    toast.error('Falha ao registrar saída')
                  })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Produto</Label>
                <div className="text-sm">{selectedProduct.nome} • Estoque atual: {selectedProduct.estoque}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saida-qty">Quantidade</Label>
                <Input
                  id="saida-qty"
                  type="number"
                  min="1"
                  value={saidaQty}
                  onChange={(e) => setSaidaQty(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saida-dest">Destinatário</Label>
                <Input id="saida-dest" value={saidaDestinatario} onChange={(e) => setSaidaDestinatario(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saida-data">Data</Label>
                <Input id="saida-data" type="date" value={saidaData} onChange={(e) => setSaidaData(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Confirmar Saída</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Histórico de Saídas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="text-xs [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow className="border-b border-b-[0.25px] border-input">
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!saidasData || saidasData.length === 0) ? (
                <TableRow className="border-b border-b-[0.25px] border-input">
                  <TableCell colSpan={5} className="text-muted-foreground">Nenhuma saída registrada</TableCell>
                </TableRow>
              ) : (
                saidasData.map((s, idx) => (
                  <TableRow key={`${s.id}-${idx}`} className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input">
                    <TableCell>{produtos.find(p => p.id === s.produto_id)?.nome || s.produto_id}</TableCell>
                    <TableCell>{s.quantidade}</TableCell>
                    <TableCell>{s.destinatario || '-'}</TableCell>
                    <TableCell>{s.data || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Editar"
                          onClick={() => {
                            setSelectedSaida(s)
                            setSaidaEditForm({
                              quantidade: s.quantidade,
                              destinatario: s.destinatario || '',
                              data: s.data || '',
                            })
                            setSaidaEditOpen(true)
                          }}
                        >
                          <PencilLine />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label="Excluir"
                          onClick={async () => {
                            await deleteSaida(s.id)
                            await queryClient.invalidateQueries({ queryKey: ['produto_saidas'] })
                            await queryClient.invalidateQueries({ queryKey: ['produtos'] })
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={saidaEditOpen} onOpenChange={setSaidaEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saída</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!selectedSaida) return
              await updateSaida(selectedSaida.id, {
                quantidade: Math.max(1, Number(saidaEditForm.quantidade) || 1),
                destinatario: (saidaEditForm.destinatario || undefined),
                data: (saidaEditForm.data || undefined),
              })
              await queryClient.invalidateQueries({ queryKey: ['produto_saidas'] })
              await queryClient.invalidateQueries({ queryKey: ['produtos'] })
              setSaidaEditOpen(false)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-qty">Quantidade</Label>
              <Input id="edit-qty" type="number" min="1" value={saidaEditForm.quantidade} onChange={(e) => setSaidaEditForm({ ...saidaEditForm, quantidade: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dest">Destinatário</Label>
              <Input id="edit-dest" value={saidaEditForm.destinatario} onChange={(e) => setSaidaEditForm({ ...saidaEditForm, destinatario: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-data">Data</Label>
              <Input id="edit-data" type="date" value={saidaEditForm.data} onChange={(e) => setSaidaEditForm({ ...saidaEditForm, data: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produtos;
