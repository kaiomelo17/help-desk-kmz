import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { listChamados, type Chamado } from '@/lib/api/chamados'
import { useMemo, useState, useCallback } from 'react'
import { TrendingUp, HeadphonesIcon, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AnaliseServicos = () => {
  const navigate = useNavigate()
  const { data: chamados } = useQuery({ queryKey: ['chamados'], queryFn: listChamados, staleTime: 30000 })

  const tipos = useMemo(() => Array.from(new Set((chamados ?? []).map(c => c.tipo_servico))).filter(Boolean), [chamados])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Chamado['status']>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [periodo, setPeriodo] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos')

  const isInPeriodo = useCallback((dateStr?: string) => {
    if (!dateStr || periodo === 'todos') return true
    const d = new Date(dateStr)
    const now = new Date()
    if (periodo === 'hoje') {
      return d.toDateString() === now.toDateString()
    }
    if (periodo === 'semana') {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }
    if (periodo === 'mes') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  }, [periodo])

  const filtered = useMemo(() => {
    const rows = (chamados ?? [])
    return rows.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (tipoFilter !== 'all' && c.tipo_servico !== tipoFilter) return false
      if (!isInPeriodo(c.data)) return false
      const term = search.toLowerCase()
      if (term && !`${c.titulo} ${c.usuario} ${c.solicitante}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [chamados, statusFilter, tipoFilter, periodo, search, isInPeriodo])

  const metrics = useMemo(() => {
    const rows = filtered
    const hojeStr = new Date().toISOString().split('T')[0]
    const feitosHoje = rows.filter(r => r.data === hojeStr && r.status === 'Concluído').length
    const emAberto = rows.filter(r => r.status === 'Aberto').length
    const emAndamento = rows.filter(r => r.status === 'Em Andamento').length
    const durations = rows
      .filter(r => r.status === 'Concluído' && !!r.started_at && !!r.completed_at)
      .map(r => {
        const start = new Date(r.started_at as string).getTime()
        const end = new Date(r.completed_at as string).getTime()
        return Math.max(0, end - start)
      })
    const minMs = durations.length ? Math.min(...durations) : null
    const tempoMinimoPorServico = (() => {
      if (!minMs || !isFinite(minMs)) return '-'
      const totalMin = Math.floor(minMs / 60000)
      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      if (h > 0) return `${h}h ${m}m`
      return `${m}m`
    })()
    return { tempoMinimoPorServico, feitosHoje, emAberto, emAndamento }
  }, [filtered])

  const getStatusColor = (status: Chamado['status']) => {
    switch (status) {
      case 'Aberto': return 'default'
      case 'Em Andamento': return 'default'
      case 'Concluído': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header flex items-center gap-2"><HeadphonesIcon className="h-6 w-6" /> Análise de Serviços</h1>
          <p className="text-muted-foreground">Filtros personalizados e métricas dos serviços</p>
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
                placeholder="Buscar por título, usuário, solicitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ('all' | Chamado['status']))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as ('todos' | 'hoje' | 'semana' | 'mes'))}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Últimos 7 dias</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Tempo mínimo por serviço</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.tempoMinimoPorServico}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feitos hoje</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.feitosHoje}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Em aberto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.emAberto}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Em andamento</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.emAndamento}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Serviços (filtrados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.slice(0, 50).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-sm text-muted-foreground">{c.tipo_servico} • {c.usuario}</p>
                </div>
                <Badge variant={getStatusColor(c.status)}>{c.status}</Badge>
              </div>
            ))}
            {!filtered.length && <p className="text-sm text-muted-foreground">Nenhum serviço encontrado com os filtros selecionados.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnaliseServicos
