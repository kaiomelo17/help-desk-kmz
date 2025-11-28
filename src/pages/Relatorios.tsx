import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const Relatorios = () => {
  const [periodo, setPeriodo] = useState('mensal');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Relatórios</h1>
        <p className="text-muted-foreground">Visualize estatísticas e relatórios do sistema</p>
      </div>

      <div className="flex items-center gap-4">
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
                    <div className="h-full bg-success w-3/4" />
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Em Uso</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2" />
                  </div>
                  <span className="text-sm font-medium">50%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manutenção</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning w-1/4" />
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inativo</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive w-1/6" />
                  </div>
                  <span className="text-sm font-medium">15%</span>
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
                    <div className="h-full bg-destructive w-1/3" />
                  </div>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Média</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning w-2/3" />
                  </div>
                  <span className="text-sm font-medium">28</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Baixa</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-success w-1/2" />
                  </div>
                  <span className="text-sm font-medium">18</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
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
                <p className="text-2xl font-bold mt-2">2.5h</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                <p className="text-2xl font-bold mt-2">94%</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Satisfação do Usuário</p>
                <p className="text-2xl font-bold mt-2">4.8/5</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Chamados Resolvidos</p>
                <p className="text-2xl font-bold mt-2">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
