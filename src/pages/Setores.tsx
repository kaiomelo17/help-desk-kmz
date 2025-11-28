import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Building2, User, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Sector {
  id: string;
  nome: string;
  responsavel: string;
  ramal: string;
  localizacao: string;
}

const Setores = () => {
  const [setores, setSetores] = useState<Sector[]>([
    { id: '1', nome: 'TI', responsavel: 'Carlos Silva', ramal: '2001', localizacao: '3º Andar - Sala 301' },
    { id: '2', nome: 'Financeiro', responsavel: 'Ana Costa', ramal: '2002', localizacao: '2º Andar - Sala 205' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    responsavel: '',
    ramal: '',
    localizacao: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSector: Sector = {
      id: Date.now().toString(),
      ...formData,
    };
    setSetores([...setores, newSector]);
    setFormData({ nome: '', responsavel: '', ramal: '', localizacao: '' });
    setDialogOpen(false);
    toast.success('Setor cadastrado com sucesso!');
  };

  const filteredSectors = setores.filter(sector =>
    sector.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSectors.map((sector) => (
          <Card key={sector.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-lg">{sector.nome}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{sector.responsavel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Ramal: {sector.ramal}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{sector.localizacao}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Setores;
