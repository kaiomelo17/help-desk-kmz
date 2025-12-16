import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { listEquipamentos, type Equipamento } from '@/lib/api/equipamentos'
import { listSetores } from '@/lib/api/setores'
import { useMemo, useState } from 'react'
import { HardHat, TrendingUp, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AnaliseEquipamentos = () => {
  const navigate = useNavigate()
  const { data: equipamentos } = useQuery({ queryKey: ['equipamentos'], queryFn: listEquipamentos, staleTime: 30000 })
  const { data: setores } = useQuery({ queryKey: ['setores'], queryFn: listSetores, staleTime: 60000 })

  const tipos = useMemo(() => Array.from(new Set((equipamentos ?? []).map(e => e.tipo))), [equipamentos])
  const setoresOptions = useMemo(() => (setores ?? []).map(s => s.nome), [setores])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Equipamento['status']>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [setorFilter, setSetorFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    const rows = (equipamentos ?? [])
    return rows.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (tipoFilter !== 'all' && e.tipo !== tipoFilter) return false
      if (setorFilter !== 'all' && (e.setor ?? '-') !== setorFilter) return false
      const term = search.toLowerCase()
      if (term && !`${e.nome} ${e.patrimonio} ${e.usuario ?? ''}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [equipamentos, statusFilter, tipoFilter, setorFilter, search])

  const equipamentosStatus = useMemo(() => {
    const rows = filtered
    const count = (s: Equipamento['status']) => rows.filter(r => r.status === s).length
    const inativo = count('Inativo')
    const ativos = Math.max(0, rows.length - inativo)
    return {
      ativos,
      disponiveis: count('Disponível'),
      emUso: count('Em Uso'),
      manutencao: count('Manutenção'),
      inativo,
    }
  }, [filtered])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header flex items-center gap-2"><HardHat className="h-6 w-6" /> Análise de Equipamentos</h1>
          <p className="text-muted-foreground">Filtros personalizados e métricas dos ativos</p>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="border border-input" aria-label="Voltar para o Dashboard" onClick={() => navigate('/dashboard')}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Input
                placeholder="Buscar por nome, patrimônio, usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ('all' | Equipamento['status']))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Em Uso">Em Uso</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {setoresOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader><CardTitle>Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipamentosStatus.ativos}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Disponíveis</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{equipamentosStatus.disponiveis}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Em Uso</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{equipamentosStatus.emUso}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Manutenção</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{equipamentosStatus.manutencao}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Inativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{equipamentosStatus.inativo}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado dos Ativos (filtrados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.slice(0, 50).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium">{e.nome}</p>
                  <p className="text-sm text-muted-foreground">{e.tipo} • {e.setor || '-'} • {e.usuario || '-'}</p>
                </div>
                <Badge variant={e.status === 'Manutenção' ? 'destructive' : 'default'}>{e.status}</Badge>
              </div>
            ))}
            {!filtered.length && <p className="text-sm text-muted-foreground">Nenhum equipamento encontrado com os filtros selecionados.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnaliseEquipamentos
