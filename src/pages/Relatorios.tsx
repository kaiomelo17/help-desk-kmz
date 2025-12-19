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
import { listChamados, updateChamado, deleteChamado, type Chamado } from '@/lib/api/chamados';
import { useQueryClient } from '@tanstack/react-query';

const Relatorios = () => {
  const [periodo, setPeriodo] = useState('todos');
  const queryClient = useQueryClient()
  const { data: equipamentos } = useQuery({ queryKey: ['equipamentos'], queryFn: listEquipamentos, staleTime: 30000 })
  const { data: chamados } = useQuery({ queryKey: ['chamados'], queryFn: listChamados, staleTime: 30000 })
  const formatMinutes = (minutes?: number | null) => {
    if (minutes == null || isNaN(minutes)) return '-'
    const m = Math.max(0, Math.floor(minutes))
    if (m < 60) return `${m} min`
    const hours = Math.floor(m / 60)
    const remMin = m % 60
    if (hours < 24) return `${hours}h ${remMin}min`
    const days = Math.floor(hours / 24)
    const remH = hours % 24
    return `${days} dias ${remH}h ${remMin}min`
  }
  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start && !end) return '-'
    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null
    const s = startDate && !isNaN(startDate.getTime()) ? startDate : null
    const e = endDate && !isNaN(endDate.getTime()) ? endDate : null
    const from = s ?? null
    const to = e ?? new Date()
    if (!from || !to) return '-'
    const ms = to.getTime() - from.getTime()
    if (ms < 0) return '-'
    const minutes = Math.floor(ms / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remMin = minutes % 60
    if (hours < 24) return `${hours}h ${remMin}min`
    const days = Math.floor(hours / 24)
    const remH = hours % 24
    return `${days} dias ${remH}h ${remMin}min`
  }
  const periodStart = useMemo(() => {
    const now = new Date()
    if (periodo === 'diario') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
    if (periodo === 'semanal') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    if (periodo === 'mensal') {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    if (periodo === 'anual') {
      return new Date(now.getFullYear(), 0, 1)
    }
    return null
  }, [periodo])
  const periodEnd = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  }, [])
  const parseRowDate = (d?: string) => {
    if (!d) return null
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(d)
    const dt = isDateOnly ? new Date(`${d}T00:00:00`) : new Date(d)
    return isNaN(dt.getTime()) ? null : dt
  }
  const filteredChamados = useMemo(() => {
    const rows = (chamados ?? [])
    return rows.filter(r => {
      const dt = parseRowDate(r.data ?? r.created_at)
      if (!dt) return false
      if (!periodStart) return true
      return dt >= periodStart && dt <= periodEnd
    })
  }, [chamados, periodStart, periodEnd])
  const filteredEquipamentos = useMemo(() => {
    const rows = (equipamentos ?? [])
    return rows.filter(r => {
      const dt = parseRowDate(r.created_at)
      if (!dt) return false
      if (!periodStart) return true
      return dt >= periodStart && dt <= periodEnd
    })
  }, [equipamentos, periodStart, periodEnd])
  const eqStatus = useMemo(() => {
    const rows = filteredEquipamentos
    const total = rows.length || 1
    const count = (s: string) => rows.filter(r => r.status === s).length
    return {
      disponivel: { count: count('Disponível'), pct: Math.round((count('Disponível') / total) * 100) },
      emUso: { count: count('Em Uso'), pct: Math.round((count('Em Uso') / total) * 100) },
      manutencao: { count: count('Manutenção'), pct: Math.round((count('Manutenção') / total) * 100) },
      inativo: { count: count('Inativo'), pct: Math.round((count('Inativo') / total) * 100) },
    }
  }, [filteredEquipamentos])
  const chPrior = useMemo(() => {
    const rows = filteredChamados
    const count = (p: string) => rows.filter(r => r.prioridade === p).length
    return {
      alta: count('alta'),
      media: count('media'),
      baixa: count('baixa'),
      resolvidos: rows.filter(r => r.status === 'Concluído').length,
    }
  }, [filteredChamados])
  const tempoMedio = useMemo(() => {
    const rows = filteredChamados.filter(r => r.status === 'Concluído')
    const durations = rows.map(r => {
      if (typeof r.tempo_solucao_minutos === 'number') return Math.max(0, Math.floor(r.tempo_solucao_minutos))
      if (typeof r.solution_duration_min === 'number') return Math.max(0, Math.floor(r.solution_duration_min))
      const sStr = r.started_at || r.created_at || r.data
      const eStr = r.completed_at || null
      const s = sStr ? new Date(sStr) : null
      const e = eStr ? new Date(eStr) : null
      if (s && e && !isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 60000))
      }
      return null
    }).filter((m): m is number => typeof m === 'number' && isFinite(m))
    if (!durations.length) return '-'
    const avgMin = Math.floor(durations.reduce((acc, m) => acc + m, 0) / durations.length)
    return formatMinutes(avgMin)
  }, [filteredChamados])
  const concluidos = useMemo(() => filteredChamados.filter(r => r.status === 'Concluído'), [filteredChamados])
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Chamado | null>(null)
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
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-primary" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Tempo Médio de Atendimento</p>
              <p className="text-lg font-semibold mt-1">{tempoMedio}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
              <p className="text-lg font-semibold mt-1">
                {(() => {
                  const total = (filteredChamados.length ?? 0) || 1
                  const resolved = (chPrior.resolvidos || 0)
                  return `${Math.round((resolved / total) * 100)}%`
                })()}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Satisfação do Usuário</p>
              <p className="text-lg font-semibold mt-1">-</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Chamados Resolvidos</p>
              <p className="text-lg font-semibold mt-1">{chPrior.resolvidos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-3 w-3 text-primary" />
              Equipamentos por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-3">
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
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-primary" />
              Chamados por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-3">
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
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">Histórico de Chamados Concluídos</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
          <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow className="border-b border-b-[0.25px] border-input">
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tempo de Solução</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concluidos.length === 0 ? (
                <TableRow className="border-b border-b-[0.25px] border-input">
                  <TableCell colSpan={6} className="text-muted-foreground">Nenhum chamado concluído</TableCell>
                </TableRow>
              ) : (
                concluidos.map((c) => (
                  <TableRow
                    key={c.id}
                    className="odd:bg-muted/40 even:bg-card hover:bg-muted border-b border-b-[0.25px] border-input"
                    onDoubleClick={() => {
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
                    <TableCell className="truncate max-w-[280px]">{c.titulo}</TableCell>
                    <TableCell>{c.solicitante}</TableCell>
                    <TableCell>{c.setor}</TableCell>
                    <TableCell>{c.tipo_servico}</TableCell>
                    <TableCell>{c.data || '-'}</TableCell>
                    <TableCell>{
                      typeof c.tempo_solucao_texto === 'string' && c.tempo_solucao_texto
                        ? c.tempo_solucao_texto
                        : typeof c.tempo_solucao_minutos === 'number'
                          ? formatMinutes(c.tempo_solucao_minutos)
                          : typeof c.solution_duration_min === 'number'
                            ? formatMinutes(c.solution_duration_min)
                            : formatDuration(c.started_at || c.created_at || c.data, c.completed_at)
                    }</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
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
                data: formData.data || undefined,
              })
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
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">Salvar</Button>
              <Button
                type="button"
                className="flex-1"
                onClick={async () => {
                  if (!selected) return
                  await updateChamado(selected.id, { status: 'Aberto' })
                  await queryClient.invalidateQueries({ queryKey: ['chamados'] })
                  setEditOpen(false)
                }}
              >
                Reabrir
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  if (!selected) return
                  if (confirm('Deseja realmente excluir este histórico?')) {
                    await deleteChamado(selected.id)
                    await queryClient.invalidateQueries({ queryKey: ['chamados'] })
                    setEditOpen(false)
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Relatorios;
