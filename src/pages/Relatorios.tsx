import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, TrendingUp, PencilLine, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listEquipamentos } from '@/lib/api/equipamentos';
import { listChamados, updateChamado, deleteChamado } from '@/lib/api/chamados';
import { useQueryClient } from '@tanstack/react-query';

const Relatorios = () => {
  const [periodo, setPeriodo] = useState('mensal');
  const queryClient = useQueryClient()
  const { data: equipamentos } = useQuery({ queryKey: ['equipamentos'], queryFn: listEquipamentos, staleTime: 30000 })
  const { data: chamados } = useQuery({ queryKey: ['chamados'], queryFn: listChamados, staleTime: 30000 })
  const eqStatus = useMemo(() => {
    const rows = equipamentos ?? []
    const total = rows.length || 1
    const count = (s: string) => rows.filter(r => r.status === s).length
    return {
      disponivel: { count: count('Disponível'), pct: Math.round((count('Disponível') / total) * 100) },
      emUso: { count: count('Em Uso'), pct: Math.round((count('Em Uso') / total) * 100) },
      manutencao: { count: count('Manutenção'), pct: Math.round((count('Manutenção') / total) * 100) },
      inativo: { count: count('Inativo'), pct: Math.round((count('Inativo') / total) * 100) },
    }
  }, [equipamentos])
  const chPrior = useMemo(() => {
    const rows = chamados ?? []
    const count = (p: string) => rows.filter(r => r.prioridade === p).length
    return {
      alta: count('alta'),
      media: count('media'),
      baixa: count('baixa'),
      resolvidos: rows.filter(r => r.status === 'Concluído').length,
    }
  }, [chamados])
  const concluidos = useMemo(() => (chamados ?? []).filter(r => r.status === 'Concluído'), [chamados])
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [formData, setFormData] = useState({ titulo: '', descricao: '', solicitante: '', setor: '', tipo_servico: '', data: '' })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-header">Relatórios</h1>
          <p className="text-muted-foreground">Visualize estatísticas e relatórios do sistema</p>
        </div>
        <div className="flex items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Tempo Médio de Atendimento</p>
              <p className="text-2xl font-bold mt-2">-</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
              <p className="text-2xl font-bold mt-2">
                {(() => {
                  const total = (chamados?.length ?? 0) || 1
                  const resolved = (chPrior.resolvidos || 0)
                  return `${Math.round((resolved / total) * 100)}%`
                })()}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Satisfação do Usuário</p>
              <p className="text-2xl font-bold mt-2">-</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Chamados Resolvidos</p>
              <p className="text-2xl font-bold mt-2">{chPrior.resolvidos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Equipamentos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Disponível</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${eqStatus.disponivel.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium">{eqStatus.disponivel.pct}% ({eqStatus.disponivel.count})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Em Uso</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${eqStatus.emUso.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium">{eqStatus.emUso.pct}% ({eqStatus.emUso.count})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manutenção</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${eqStatus.manutencao.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium">{eqStatus.manutencao.pct}% ({eqStatus.manutencao.count})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inativo</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: `${eqStatus.inativo.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium">{eqStatus.inativo.pct}% ({eqStatus.inativo.count})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Chamados por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Alta</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: `${Math.min(100, (chPrior.alta || 0) * 10)}%` }} />
                  </div>
                  <span className="text-sm font-medium">{chPrior.alta}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Média</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${Math.min(100, (chPrior.media || 0) * 10)}%` }} />
                  </div>
                  <span className="text-sm font-medium">{chPrior.media}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Baixa</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${Math.min(100, (chPrior.baixa || 0) * 10)}%` }} />
                  </div>
                  <span className="text-sm font-medium">{chPrior.baixa}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Chamados Concluídos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concluidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">Nenhum chamado concluído</TableCell>
                </TableRow>
              ) : (
                concluidos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="truncate max-w-[280px]">{c.titulo}</TableCell>
                    <TableCell>{c.solicitante}</TableCell>
                    <TableCell>{c.setor}</TableCell>
                    <TableCell>{c.tipo_servico}</TableCell>
                    <TableCell>{c.data || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Editar"
                          onClick={() => {
                            setSelected(c)
                            setFormData({
                              titulo: c.titulo,
                              descricao: c.descricao,
                              solicitante: c.solicitante,
                              setor: c.setor,
                              tipo_servico: c.tipo_servico,
                              data: c.data || '',
                            })
                            setEditOpen(true)
                          }}
                        >
                          <PencilLine />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label="Excluir"
                          onClick={async () => {
                            await deleteChamado(c.id)
                            await queryClient.invalidateQueries({ queryKey: ['chamados'] })
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Histórico</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!selected) return
              await updateChamado(selected.id, {
                titulo: formData.titulo,
                descricao: formData.descricao,
                solicitante: formData.solicitante,
                setor: formData.setor,
                tipo_servico: formData.tipo_servico,
                data: formData.data || null as any,
              } as any)
              await queryClient.invalidateQueries({ queryKey: ['chamados'] })
              setEditOpen(false)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="hist-titulo">Título</Label>
              <Input id="hist-titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hist-desc">Descrição</Label>
              <Textarea id="hist-desc" rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-solic">Solicitante</Label>
                <Input id="hist-solic" value={formData.solicitante} onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-setor">Setor</Label>
                <Input id="hist-setor" value={formData.setor} onChange={(e) => setFormData({ ...formData, setor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-tipo">Tipo de Serviço</Label>
                <Input id="hist-tipo" value={formData.tipo_servico} onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-data">Data</Label>
                <Input id="hist-data" type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Relatorios;
