import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listEquipamentos, updateEquipamento, deleteEquipamento, type Equipamento } from '@/lib/api/equipamentos'
import { listSetores } from '@/lib/api/setores'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { HardHat, TrendingUp, LogOut, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AnaliseEquipamentos = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: equipamentos } = useQuery({ queryKey: ['equipamentos'], queryFn: listEquipamentos, staleTime: 30000 })
  const { data: setores } = useQuery({ queryKey: ['setores'], queryFn: listSetores, staleTime: 60000 })
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isVip = user?.tier === 'vip'
  const canEdit = isAdmin || !isVip

  const tipos = useMemo(() => Array.from(new Set((equipamentos ?? []).map(e => e.tipo))), [equipamentos])
  const setoresOptions = useMemo(() => {
    return (setores ?? [])
      .map(s => (s.nome || '').toUpperCase())
      .sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }))
  }, [setores])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Equipamento['status']>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [setorFilter, setSetorFilter] = useState<string>('all')
  const [nomeFilter, setNomeFilter] = useState('')
  const [patrimonioFilter, setPatrimonioFilter] = useState('')
  const [usuarioFilter, setUsuarioFilter] = useState('')
  const [marcaFilter, setMarcaFilter] = useState('')
  const [modeloFilter, setModeloFilter] = useState('')
  const [ramFilter, setRamFilter] = useState('')
  const [armazenamentoFilter, setArmazenamentoFilter] = useState('')
  const [processadorFilter, setProcessadorFilter] = useState('')
  const [polegadasFilter, setPolegadasFilter] = useState('')
  const [ghzFilter, setGhzFilter] = useState('')
  const topScrollRef = useRef<HTMLDivElement>(null)
  const bottomScrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLTableSectionElement>(null)
  const [scrollWidth, setScrollWidth] = useState<number>(0)
  const [headerHeight, setHeaderHeight] = useState<number>(0)
 

  const syncTopToBottom = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }
  const syncBottomToTop = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft
    }
  }

  const filtered = useMemo(() => {
    const rows = (equipamentos ?? [])
    return rows.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (tipoFilter !== 'all' && e.tipo !== tipoFilter) return false
      if (setorFilter !== 'all' && ((e.setor ?? '-').toUpperCase()) !== setorFilter) return false
      const term = search.toLowerCase()
      if (term && !`${e.nome} ${e.patrimonio} ${e.usuario ?? ''}`.toLowerCase().includes(term)) return false
      if (nomeFilter && !e.nome.toLowerCase().includes(nomeFilter.toLowerCase())) return false
      if (patrimonioFilter && !(e.patrimonio ?? '').toLowerCase().includes(patrimonioFilter.toLowerCase())) return false
      if (usuarioFilter && !(e.usuario ?? '').toLowerCase().includes(usuarioFilter.toLowerCase())) return false
      if (marcaFilter && !(e.marca ?? '').toLowerCase().includes(marcaFilter.toLowerCase())) return false
      if (modeloFilter && !(e.modelo ?? '').toLowerCase().includes(modeloFilter.toLowerCase())) return false
      if (ramFilter && !(e.ram ?? '').toLowerCase().includes(ramFilter.toLowerCase())) return false
      if (armazenamentoFilter && !(e.armazenamento ?? '').toLowerCase().includes(armazenamentoFilter.toLowerCase())) return false
      if (processadorFilter && !(e.processador ?? '').toLowerCase().includes(processadorFilter.toLowerCase())) return false
      if (polegadasFilter && !(e.polegadas ?? '').toLowerCase().includes(polegadasFilter.toLowerCase())) return false
      if (ghzFilter && !(e.ghz ?? '').toLowerCase().includes(ghzFilter.toLowerCase())) return false
      return true
    })
  }, [equipamentos, statusFilter, tipoFilter, setorFilter, search, nomeFilter, patrimonioFilter, usuarioFilter, marcaFilter, modeloFilter, ramFilter, armazenamentoFilter, processadorFilter, polegadasFilter, ghzFilter])

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

  const [prefixFilter, setPrefixFilter] = useState<'all' | 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON'>('all')
  const getPrefix = useCallback((tipo: string) => {
    if (['Desktop', 'Notebook'].includes(tipo)) return 'PC'
    if (tipo === 'Tablet') return 'TAB'
    if (tipo === 'Smartphone') return 'CEL'
    if (tipo === 'Impressora') return 'IMP'
    if (tipo === 'Monitor') return 'MON'
    return '-'
  }, [])
  const isJVName = useCallback((nome: string) => /^\s*jovem\s+aprendiz\s+\d{1,2}\s*$/i.test(nome || ''), [])
  const getPrefixByEquipment = useCallback((e: Equipamento) => (isJVName(e.nome) ? 'JV' : getPrefix(e.tipo)), [isJVName, getPrefix])
  const parseCode = useCallback((pat: string) => {
    const m = (pat || '').match(/^(JV|PC|TAB|CEL|IMP|MON)-?(\d{3})$/i)
    if (!m) return null
    return { prefix: m[1].toUpperCase() as 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON', num: Number(m[2]) }
  }, [])
  const orderMap = useMemo(() => {
    const map = new Map<string, string>()
    const assignList = (list: Equipamento[], prefix: 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON') => {
      const withCodes = list.map(e => ({ e, code: parseCode(e.patrimonio)?.num ?? null }))
      const max = withCodes.reduce((m, r) => r.code ? Math.max(m, r.code) : m, 0)
      let next = max + 1
      const sorted = [...list].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
      sorted.forEach((e) => {
        const parsed = parseCode(e.patrimonio)
        if (parsed && parsed.prefix === prefix) {
          map.set(e.id, `${prefix}${prefix === 'PC' ? '' : '-'}${String(parsed.num).padStart(3, '0')}`)
        } else {
          map.set(e.id, `${prefix}${prefix === 'PC' ? '' : '-'}${String(next).padStart(3, '0')}`)
          next++
        }
      })
    }
    const jvList = [...filtered].filter(e => isJVName(e.nome))
    assignList(jvList, 'JV')
    const pcList = [...filtered].filter(e => ['Notebook','Desktop'].includes(e.tipo) && !isJVName(e.nome))
    assignList(pcList, 'PC')
    assignList(filtered.filter(e => e.tipo === 'Tablet'), 'TAB')
    assignList(filtered.filter(e => e.tipo === 'Smartphone'), 'CEL')
    assignList(filtered.filter(e => e.tipo === 'Impressora'), 'IMP')
    assignList(filtered.filter(e => e.tipo === 'Monitor'), 'MON')
    return map
  }, [filtered, parseCode, isJVName])
  const ordered = useMemo(() => {
    const rank: Record<string, number> = { JV: 0, PC: 1, TAB: 2, CEL: 3, IMP: 4, MON: 5, '-': 6 }
    let rows = filtered.slice()
    if (prefixFilter !== 'all') rows = rows.filter(e => getPrefixByEquipment(e) === prefixFilter)
    return rows.sort((a, b) => {
      const pa = getPrefixByEquipment(a)
      const pb = getPrefixByEquipment(b)
      if (rank[pa] !== rank[pb]) return rank[pa] - rank[pb]
      const ca = parseCode(a.patrimonio)?.num ?? Number(orderMap.get(a.id)?.replace(/^(PC|TAB|CEL|IMP|MON)-?/, '') ?? '9999')
      const cb = parseCode(b.patrimonio)?.num ?? Number(orderMap.get(b.id)?.replace(/^(PC|TAB|CEL|IMP|MON)-?/, '') ?? '9999')
      if (ca !== cb) return ca - cb
      return (a.nome ?? '').localeCompare(b.nome ?? '')
    })
  }, [filtered, orderMap, prefixFilter, getPrefixByEquipment, parseCode])

  useEffect(() => {
    const updateScrollWidth = () => {
      if (bottomScrollRef.current) {
        setScrollWidth(bottomScrollRef.current.scrollWidth)
      }
    }
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight || 0)
      }
    }
    updateScrollWidth()
    updateHeaderHeight()
    const onResize = () => updateScrollWidth()
    const onResizeHeader = () => updateHeaderHeight()
    window.addEventListener('resize', onResize)
    window.addEventListener('resize', onResizeHeader)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('resize', onResizeHeader)
    }
  }, [filtered])

  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Equipamento | null>(null)
  const [formData, setFormData] = useState<Partial<Equipamento>>({})

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!selected?.id) return
      const input: Partial<Equipamento> = {
        nome: formData.nome ?? selected.nome,
        tipo: formData.tipo ?? selected.tipo,
        patrimonio: formData.patrimonio ?? selected.patrimonio,
        marca: formData.marca ?? selected.marca,
        modelo: formData.modelo ?? selected.modelo,
        status: (formData.status ?? selected.status) as Equipamento['status'],
        usuario: formData.usuario ?? selected.usuario,
        setor: formData.setor ?? selected.setor,
        ram: formData.ram ?? selected.ram,
        armazenamento: formData.armazenamento ?? selected.armazenamento,
        processador: formData.processador ?? selected.processador,
        polegadas: formData.polegadas ?? selected.polegadas,
        ghz: formData.ghz ?? selected.ghz,
      }
      return await updateEquipamento(selected.id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      setEditOpen(false)
      setSelected(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => await deleteEquipamento(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
    },
  })

  const openEdit = (e: Equipamento) => {
    setSelected(e)
    setFormData({
      nome: e.nome, tipo: e.tipo, patrimonio: e.patrimonio, marca: e.marca, modelo: e.modelo, status: e.status,
      usuario: e.usuario, setor: e.setor, ram: e.ram, armazenamento: e.armazenamento, processador: e.processador,
      polegadas: e.polegadas, ghz: e.ghz,
    })
    setEditOpen(true)
  }

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

      

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm font-medium">Ativos</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-semibold">{equipamentosStatus.ativos}</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm font-medium">Disponíveis</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><div className="text-lg font-semibold">{equipamentosStatus.disponiveis}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm font-medium">Em Uso</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><div className="text-lg font-semibold">{equipamentosStatus.emUso}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm font-medium">Manutenção</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><div className="text-lg font-semibold">{equipamentosStatus.manutencao}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm font-medium">Inativos</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><div className="text-lg font-semibold">{equipamentosStatus.inativo}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado dos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={bottomScrollRef} onScroll={syncBottomToTop} className="relative overflow-x-auto scrollbar-hidden">
            <Table className="min-w-[1400px] text-xs [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
              <TableHeader ref={headerRef}>
                <TableRow className="border-b border-b-[0.25px] border-input">
                  <TableHead>Ordem</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Armazenamento</TableHead>
                  <TableHead>Processador</TableHead>
                  <TableHead>Polegadas</TableHead>
                  <TableHead>GHz</TableHead>
                </TableRow>
                <TableRow className="border-b border-b-[0.25px] border-input">
                  <TableCell>
                    <Select value={prefixFilter} onValueChange={(v) => setPrefixFilter(v as 'all' | 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON')}>
                      <SelectTrigger><SelectValue placeholder="Prefixo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="JV">Jovem Aprendiz (JV)</SelectItem>
                        <SelectItem value="PC">Desktops/Notebooks (PC)</SelectItem>
                        <SelectItem value="TAB">Tablets (TAB)</SelectItem>
                        <SelectItem value="CEL">Smartphones (CEL)</SelectItem>
                        <SelectItem value="IMP">Impressoras (IMP)</SelectItem>
                        <SelectItem value="MON">Monitores (MON)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger><SelectValue placeholder="Filtrar tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Filtrar descrição" value={nomeFilter} onChange={(e) => setNomeFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Filtrar patrimônio" value={patrimonioFilter} onChange={(e) => setPatrimonioFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ('all' | Equipamento['status']))}>
                      <SelectTrigger><SelectValue placeholder="Filtrar status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Disponível">Disponível</SelectItem>
                        <SelectItem value="Em Uso">Em Uso</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Filtrar usuário" value={usuarioFilter} onChange={(e) => setUsuarioFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Select value={setorFilter} onValueChange={setSetorFilter}>
                      <SelectTrigger><SelectValue placeholder="Filtrar setor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {setoresOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Marca" value={marcaFilter} onChange={(e) => setMarcaFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Modelo" value={modeloFilter} onChange={(e) => setModeloFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="RAM" value={ramFilter} onChange={(e) => setRamFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Armazenamento" value={armazenamentoFilter} onChange={(e) => setArmazenamentoFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Processador" value={processadorFilter} onChange={(e) => setProcessadorFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Polegadas" value={polegadasFilter} onChange={(e) => setPolegadasFilter(e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="GHz" value={ghzFilter} onChange={(e) => setGhzFilter(e.target.value)} />
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordered.slice(0, 200).map((e) => (
                  <TableRow
                    key={e.id}
                    className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input"
                    onDoubleClick={() => {
                      setSelected(e)
                      setFormData({
                        nome: e.nome, tipo: e.tipo, patrimonio: e.patrimonio, marca: e.marca, modelo: e.modelo, status: e.status,
                        usuario: e.usuario, setor: e.setor, ram: e.ram, armazenamento: e.armazenamento, processador: e.processador,
                        polegadas: e.polegadas, ghz: e.ghz,
                      })
                      setEditOpen(true)
                    }}
                  >
                    <TableCell className="font-mono">{orderMap.get(e.id) ?? '-'}</TableCell>
                    <TableCell>{e.tipo}</TableCell>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.patrimonio}</TableCell>
                    <TableCell><Badge variant={e.status === 'Manutenção' ? 'destructive' : 'default'}>{e.status}</Badge></TableCell>
                    <TableCell>{e.usuario || '-'}</TableCell>
                    <TableCell>{e.setor || '-'}</TableCell>
                    <TableCell>{e.marca || '-'}</TableCell>
                    <TableCell>{e.modelo || '-'}</TableCell>
                    <TableCell>{e.ram || '-'}</TableCell>
                    <TableCell>{e.armazenamento || '-'}</TableCell>
                    <TableCell>{e.processador || '-'}</TableCell>
                    <TableCell>{e.polegadas || '-'}</TableCell>
                    <TableCell>{e.ghz || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div
              ref={topScrollRef}
              onScroll={syncTopToBottom}
              className="overflow-x-auto absolute left-0 right-0"
              style={{ top: headerHeight, height: 10 }}
            >
              <div style={{ width: scrollWidth || 1400, height: 8 }} />
            </div>
          </div>
          {!filtered.length && <p className="text-sm text-muted-foreground mt-2">Nenhum equipamento encontrado com os filtros selecionados.</p>}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
          </DialogHeader>
          {selected && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!canEdit) return
                updateMut.mutate()
              }}
              className="space-y-3"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Descrição</Label>
                <Input id="edit-nome" value={formData.nome ?? ''} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Input id="edit-tipo" value={formData.tipo ?? ''} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-patrimonio">Patrimônio</Label>
                <Input id="edit-patrimonio" value={formData.patrimonio ?? ''} onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={(formData.status ?? selected.status) as Equipamento['status']} onValueChange={(v) => setFormData({ ...formData, status: v as Equipamento['status'] })}>
                  <SelectTrigger id="edit-status" disabled={!canEdit}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-usuario">Usuário</Label>
                <Input id="edit-usuario" value={formData.usuario ?? ''} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-setor">Setor</Label>
                <Input id="edit-setor" value={formData.setor ?? ''} onChange={(e) => setFormData({ ...formData, setor: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="flex gap-2 pt-2">
                {canEdit && <Button type="submit" className="flex-1">Salvar</Button>}
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancelar</Button>
                {canEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      if (!selected) return
                      if (confirm('Deseja realmente excluir este equipamento?')) {
                        deleteMut.mutate(selected.id, {
                          onSuccess: async () => {
                            await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
                            setEditOpen(false)
                            setSelected(null)
                          }
                        })
                      }
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AnaliseEquipamentos
