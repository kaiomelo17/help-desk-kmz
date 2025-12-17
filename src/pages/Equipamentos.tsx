import { useState, useMemo, useCallback } from 'react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Equipment = EquipamentoType;

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
  const equipamentos = useMemo(() => (equipamentosData ?? []) as Equipment[], [equipamentosData])
  const { data: setoresData } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => await listSetores(),
    staleTime: 1000 * 60,
  })
  const setoresOptions = (setoresData ?? []).map((s: SetorType) => s.nome)

  const [searchTerm, setSearchTerm] = useState('');
  const [prefixFilter, setPrefixFilter] = useState<'all' | 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON'>('all');
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
      queryClient.setQueryData(['equipamentos'], (prev: EquipamentoType[] | undefined) => {
        const arr = Array.isArray(prev) ? prev : []
        return [created, ...arr]
      })
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      setFormData({ nome: '', tipo: '', patrimonio: '', marca: '', modelo: '', status: 'Disponível', usuario: '', setor: '', ram: '', armazenamento: '', processador: '', polegadas: '', ghz: '' })
      setDialogOpen(false)
      toast.success('Equipamento cadastrado com sucesso!')
    },
    onError: (err: unknown) => {
      const msg = typeof (err as { message?: unknown })?.message === 'string' ? (err as { message: string }).message : 'Falha ao cadastrar equipamento'
      toast.error(msg)
    }
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
    const parsed = parseCode(formData.patrimonio)
    if (parsed) {
      const hasSame = equipamentos.some(e => {
        const p = parseCode(e.patrimonio)
        return p && p.prefix === parsed.prefix && p.num === parsed.num
      })
      if (hasSame) {
        toast.error('Código já existente para este prefixo')
        return
      }
    }
    createMut.mutate()
  }

  const getPrefix = useCallback((tipo: string) => {
    if (['Desktop', 'Notebook'].includes(tipo)) return 'PC'
    if (tipo === 'Tablet') return 'TAB'
    if (tipo === 'Smartphone') return 'CEL'
    if (tipo === 'Impressora') return 'IMP'
    if (tipo === 'Monitor') return 'MON'
    return '-'
  }, [])
  const isJVName = useCallback((nome: string) => /^\s*jovem\s+aprendiz\s+\d{1,2}\s*$/i.test(nome || ''), [])
  const getPrefixByEquipment = useCallback((e: Equipment) => (isJVName(e.nome) ? 'JV' : getPrefix(e.tipo)), [isJVName, getPrefix])
  const parseCode = useCallback((pat: string) => {
    const m = (pat || '').match(/^(JV|PC|TAB|CEL|IMP|MON)-?(\d{3})$/i)
    if (!m) return null
    return { prefix: m[1].toUpperCase() as 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON', num: Number(m[2]) }
  }, [])
  const filteredEquipments = useMemo(() => {
    const term = searchTerm.toLowerCase()
    let rows = equipamentos.filter(eq =>
      eq.nome.toLowerCase().includes(term) ||
      eq.patrimonio.toLowerCase().includes(term)
    )
    if (prefixFilter !== 'all') {
      rows = rows.filter(e => getPrefixByEquipment(e) === prefixFilter)
    }
    const rank: Record<string, number> = { JV: 0, PC: 1, TAB: 2, CEL: 3, IMP: 4, MON: 5, '-': 6 }
    return rows.sort((a, b) => {
      const pa = getPrefixByEquipment(a)
      const pb = getPrefixByEquipment(b)
      if (rank[pa] !== rank[pb]) return rank[pa] - rank[pb]
      const ca = parseCode(a.patrimonio)?.num ?? 9999
      const cb = parseCode(b.patrimonio)?.num ?? 9999
      if (ca !== cb) return ca - cb
      return a.nome.localeCompare(b.nome)
    })
  }, [equipamentos, searchTerm, prefixFilter, getPrefixByEquipment, parseCode])

  const orderMap = useMemo(() => {
    const map = new Map<string, string>()
    const assignList = (list: Equipment[], prefix: 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON') => {
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
    const jvList = [...filteredEquipments].filter(e => isJVName(e.nome))
    assignList(jvList, 'JV')
    const pcList = [...filteredEquipments].filter(e => ['Notebook','Desktop'].includes(e.tipo) && !isJVName(e.nome))
    assignList(pcList, 'PC')
    assignList(filteredEquipments.filter(e => e.tipo === 'Tablet'), 'TAB')
    assignList(filteredEquipments.filter(e => e.tipo === 'Smartphone'), 'CEL')
    assignList(filteredEquipments.filter(e => e.tipo === 'Impressora'), 'IMP')
    assignList(filteredEquipments.filter(e => e.tipo === 'Monitor'), 'MON')
    return map
  }, [filteredEquipments, parseCode, isJVName])

  const nextCode = useMemo(() => {
    const p = isJVName(formData.nome) ? 'JV' : getPrefix(formData.tipo)
    if (p === '-') return ''
    const nums = equipamentos
      .filter(e => getPrefixByEquipment(e) === p)
      .map(e => parseCode(e.patrimonio)?.num)
      .filter((n): n is number => typeof n === 'number')
    const max = nums.length ? Math.max(...nums) : 0
    const num = String(max + 1).padStart(3, '0')
    return `${p}${p === 'PC' ? '' : '-'}${num}`
  }, [equipamentos, formData.tipo, formData.nome, getPrefixByEquipment, isJVName, getPrefix, parseCode])

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
    setFormData({
      nome: equipment.nome,
      tipo: equipment.tipo,
      patrimonio: equipment.patrimonio,
      marca: equipment.marca || '',
      modelo: equipment.modelo || '',
      status: equipment.status,
      usuario: equipment.usuario || '',
      setor: equipment.setor || '',
      ram: equipment.ram || '',
      armazenamento: equipment.armazenamento || '',
      processador: equipment.processador || '',
      polegadas: equipment.polegadas || '',
      ghz: equipment.ghz || '',
    });
    setEditOpen(true);
  };

  const handleDownloadPDF = async () => {
    try {
      if (!selectedEquipment) {
        toast.error('Selecione um equipamento para gerar o PDF')
        return
      }
      const target = document.getElementById('termo-responsabilidade') as HTMLElement | null
      if (!target) {
        toast.error('Abra o termo antes de gerar o PDF')
        return
      }
      const mmToPx = (mm: number) => (mm * 96) / 25.4
      const marginMm = 15
      const pageWidthMm = 210
      const contentWidthPx = Math.floor(mmToPx(pageWidthMm - marginMm * 2))
      const wrapper = document.createElement('div')
      const root = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-10000px'
      wrapper.style.top = '0'
      root.style.width = `${contentWidthPx}px`
      root.style.background = '#ffffff'
      root.style.color = '#000000'
      root.style.fontSize = '11pt'
      root.style.lineHeight = '1.4'
      root.style.padding = '0'
      root.style.paddingBottom = '8mm'
      root.style.boxSizing = 'border-box'
      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.justifyContent = 'center'
      header.style.alignItems = 'center'
      header.style.padding = '0'
      const logo = document.createElement('img')
      logo.src = LOGO_SRC
      logo.alt = 'Concrem Portas Premium'
      logo.style.maxWidth = '120mm'
      logo.style.height = 'auto'
      logo.style.display = 'block'
      header.appendChild(logo)
      const title = document.createElement('h2')
      title.textContent = `TERMO DE RESPONSABILIDADE DE ${String(selectedEquipment.tipo || '').toUpperCase() || 'EQUIPAMENTO'}`
      title.style.textAlign = 'center'
      title.style.fontSize = '16pt'
      title.style.fontWeight = '600'
      title.style.margin = '12mm 0 8mm'
      const body = document.createElement('div')
      body.style.fontSize = '11pt'
      body.style.textAlign = 'justify'
      body.style.display = 'grid'
      body.style.gap = '5mm'
      const pIntro = document.createElement('p')
      const e = selectedEquipment as Equipment
      const specs: string[] = []
      if (['Desktop','Notebook','Smartphone'].includes(e?.tipo)) {
        if (e?.ram) specs.push(`Memória RAM: ${e.ram}`)
        if (e?.armazenamento) specs.push(`Armazenamento: ${e.armazenamento}`)
      }
      if (['Desktop','Notebook'].includes(e?.tipo)) {
        if (e?.processador) specs.push(`Processador: ${e.processador}`)
      }
      if (e?.tipo === 'Monitor') {
        if (e?.polegadas) specs.push(`Polegadas: ${e.polegadas}`)
        if (e?.ghz) specs.push(`GHz: ${e.ghz}`)
      }
      const specsText = specs.length ? specs.join(' • ') : '-'
      pIntro.innerHTML = `CONCREM INDUSTRIAL LTDA, com matriz no endereço Rodovia BR 010, s/n° / KM 31, inscrita no CNPJ sob o n° 18.543.638/0001-34, neste ato, entrega de ${selectedEquipment.tipo} marca: ${e?.marca || '-'} modelo: ${e?.modelo || '-'} ESPECIFICAÇÕES: ${specsText}, ao funcionário ${selectedEquipment.usuario || '-'}, doravante denominado simplesmente "USUÁRIO", sob as seguintes condições:`
      const list = document.createElement('ol')
      list.style.listStyle = 'decimal'
      list.style.paddingLeft = '6mm'
      list.style.margin = '0'
      const items = [
        { title: 'Uso Exclusivo', text: 'O equipamento deverá ser utilizado ÚNICA e EXCLUSIVAMENTE a serviço da empresa, tendo em vista a atividade a ser exercida pelo USUÁRIO.' },
        { title: 'Responsabilidade', text: 'O USUÁRIO será responsável pelo uso e conservação do equipamento.' },
        { title: 'Detenção e Propriedade', text: 'O USUÁRIO detém apenas a posse do equipamento para a prestação de serviços profissionais e não a propriedade do mesmo. É terminantemente proibido o empréstimo, aluguel ou cessão deste a terceiros.' },
        { title: 'Devolução', text: 'Ao término da prestação de serviço ou do contrato individual de trabalho, o USUÁRIO compromete-se a devolver o equipamento em perfeito estado, no mesmo dia em que for comunicado ou comunique seu desligamento, considerando o desgaste natural pelo uso normal do equipamento.' },
      ]
      for (const it of items) {
        const li = document.createElement('li')
        const strong = document.createElement('strong')
        strong.textContent = `${it.title}: `
        li.appendChild(strong)
        li.append(it.text)
        li.style.marginBottom = '3mm'
        list.appendChild(li)
      }
      const meta = document.createElement('div')
      meta.style.display = 'flex'
      meta.style.justifyContent = 'space-between'
      meta.style.marginTop = '6mm'
      meta.style.fontSize = '10.5pt'
      meta.innerHTML = `<span>Dom Eliseu / ${new Date().toLocaleDateString('pt-BR')}</span><span>Setor: ${selectedEquipment.setor || '-'}</span>`
      body.appendChild(pIntro)
      body.appendChild(list)
      body.appendChild(meta)
      root.appendChild(header)
      root.appendChild(title)
      root.appendChild(body)
      wrapper.appendChild(root)
      document.body.appendChild(wrapper)
      await new Promise((r) => setTimeout(r, 0))
      const canvas = await html2canvas(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      document.body.removeChild(wrapper)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const contentWidthMm = pageWidth - marginMm * 2
      const contentHeightMm = contentWidthMm * (canvas.height / canvas.width)
      const footerReservedMm = 12
      const signatureReservedMm = 50
      const availableHeightMm = pageHeight - marginMm * 2 - footerReservedMm - signatureReservedMm
      let drawWidthMm = contentWidthMm
      let drawHeightMm = contentHeightMm
      if (contentHeightMm > availableHeightMm) {
        const scaleFactor = availableHeightMm / contentHeightMm
        drawWidthMm = contentWidthMm * scaleFactor
        drawHeightMm = contentHeightMm * scaleFactor
      }
      const x = (pageWidth - drawWidthMm) / 2
      const contentY = marginMm
      pdf.addImage(imgData, 'PNG', x, contentY, drawWidthMm, drawHeightMm)
      const borderColor = { r: 26, g: 73, b: 33 }
      pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      pdf.setLineWidth(0.7)
      pdf.rect(3, 3, pageWidth - 6, pageHeight - 6)
      const blankBeforeSignatureMm = 18
      const signatureY = contentY + drawHeightMm + blankBeforeSignatureMm
      const blockWidthMm = 70
      const blockGapMm = 12
      const totalBlockWidthMm = blockWidthMm * 2 + blockGapMm
      const startX = (pageWidth - totalBlockWidthMm) / 2
      pdf.setLineWidth(0.4)
      pdf.line(startX, signatureY, startX + blockWidthMm, signatureY)
      pdf.line(startX + blockWidthMm + blockGapMm, signatureY, startX + blockWidthMm * 2 + blockGapMm, signatureY)
      pdf.setFontSize(11)
      const labelY = signatureY + 6
      pdf.text('Assinatura do Responsável', startX + blockWidthMm / 2, labelY, { align: 'center' })
      pdf.text('CPF do Responsável', startX + blockWidthMm + blockGapMm + blockWidthMm / 2, labelY, { align: 'center' })
      const nomeCenterY = labelY + 12
      const nomeText = `Nome: ${selectedEquipment.usuario || '-'}`
      pdf.text(nomeText, pageWidth / 2, nomeCenterY, { align: 'center' })
      pdf.setFontSize(9)
      const footerText = 'Rod. BR-010, Km 31, Interior - Cep 68653-000 Dom Eliseu-PA - Tel: (94) 98114-2020 • CNPJ: 18.543.638/0001-34 • IE: 15.417.865-9'
      const footerY = pageHeight - marginMm
      pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' })
      const filename = `termo-${selectedEquipment?.patrimonio || selectedEquipment?.tipo || 'equipamento'}.pdf`
      pdf.save(filename)
      toast.success('PDF gerado com sucesso')
    } catch (err) {
      toast.error('Falha ao gerar PDF do termo')
    }
  }

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
              {formData.tipo && getPrefix(formData.tipo) !== '-' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Código sugerido</Label>
                    <Input value={nextCode} readOnly />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setFormData({ ...formData, patrimonio: nextCode })}>
                      Usar sugestão
                    </Button>
                  </div>
                </div>
              )}
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
        <div className="w-[220px]">
          <Select value={prefixFilter} onValueChange={(v) => setPrefixFilter(v as 'all' | 'JV' | 'PC' | 'TAB' | 'CEL' | 'IMP' | 'MON')}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por prefixo" />
            </SelectTrigger>
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
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
          <Table className="text-sm [&_th]:text-sm [&_td]:py-1.5 [&_th]:py-1.5 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow className="border-b border-b-[0.25px] border-input">
                <TableHead>Ordem</TableHead>
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
                <TableRow key={equipment.id} className="odd:bg-muted/40 even:bg-white hover:bg-muted border-b border-b-[0.25px] border-input">
                  <TableCell className="font-mono">{orderMap.get(equipment.id) ?? '-'}</TableCell>
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
          </div>
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
                    const e = selectedEquipment as Equipment
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
            <Button onClick={handleDownloadPDF} className="flex-1">
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
