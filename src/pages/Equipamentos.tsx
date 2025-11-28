import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  nome: string;
  tipo: string;
  patrimonio: string;
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo';
  usuario?: string;
  setor?: string;
}

const Equipamentos = () => {
  const [equipamentos, setEquipamentos] = useState<Equipment[]>([
    { id: '1', nome: 'Notebook Dell', tipo: 'Notebook', patrimonio: 'PAT-001', status: 'Em Uso', usuario: 'João Silva', setor: 'TI' },
    { id: '2', nome: 'Impressora HP', tipo: 'Impressora', patrimonio: 'PAT-002', status: 'Disponível' },
    { id: '3', nome: 'Monitor LG 24"', tipo: 'Monitor', patrimonio: 'PAT-003', status: 'Em Uso', usuario: 'Maria Santos', setor: 'Financeiro' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    patrimonio: '',
    status: 'Disponível' as Equipment['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEquipment: Equipment = {
      id: Date.now().toString(),
      ...formData,
    };
    setEquipamentos([...equipamentos, newEquipment]);
    setFormData({ nome: '', tipo: '', patrimonio: '', status: 'Disponível' });
    setDialogOpen(false);
    toast.success('Equipamento cadastrado com sucesso!');
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">Equipamentos</h1>
          <p className="text-muted-foreground">Gerencie os equipamentos da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipments.map((equipment) => (
          <Card key={equipment.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{equipment.nome}</span>
                <Badge variant={getStatusColor(equipment.status)}>{equipment.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Tipo:</span> {equipment.tipo}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Patrimônio:</span> {equipment.patrimonio}
              </div>
              {equipment.usuario && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Usuário:</span> {equipment.usuario}
                </div>
              )}
              {equipment.setor && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Setor:</span> {equipment.setor}
                </div>
              )}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePrintTerm(equipment)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Termo de Responsabilidade
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Termo de Responsabilidade Dialog */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termo de Responsabilidade</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-6 p-6 bg-white text-black" id="termo-responsabilidade">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">CONCREM PORTAS PREMIUM</h2>
                <h3 className="text-lg mt-2">TERMO DE RESPONSABILIDADE DE EQUIPAMENTO</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">DADOS DO EQUIPAMENTO:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Nome: {selectedEquipment.nome}</div>
                    <div>Tipo: {selectedEquipment.tipo}</div>
                    <div>Patrimônio: {selectedEquipment.patrimonio}</div>
                    <div>Status: {selectedEquipment.status}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">DADOS DO RESPONSÁVEL:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Nome: {selectedEquipment.usuario || '_________________________'}</div>
                    <div>Setor: {selectedEquipment.setor || '_________________________'}</div>
                    <div className="col-span-2">CPF: _________________________</div>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <p>Pelo presente termo, declaro ter recebido o equipamento acima identificado, comprometendo-me a:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Zelar pela conservação e bom uso do equipamento;</li>
                    <li>Não permitir que terceiros utilizem o equipamento;</li>
                    <li>Comunicar imediatamente qualquer defeito ou problema;</li>
                    <li>Devolver o equipamento quando solicitado;</li>
                    <li>Responsabilizar-me por eventuais danos causados por mau uso.</li>
                  </ul>
                </div>

                <div className="pt-8 space-y-8">
                  <div>
                    <p className="text-sm">Data: _____/_____/_________</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-sm text-center">Assinatura do Responsável</p>
                  </div>
                </div>
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
    </div>
  );
};

export default Equipamentos;
