import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginUser, loginPassword);
    if (success) {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } else {
      toast.error('usuário ou senha incorretos.');
    }
  };

  

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('/login.jpg'), linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary-hover)))",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <Card className="relative z-10 w-full max-w-md bg-transparent border-transparent shadow-none">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center items-center mb-4 gap-3"></div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-white text-base underline underline-offset-4 decoration-primary-hover">Usuário</Label>

              <Input
                id="usuario"
                type="usuario"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="bg-background/50 backdrop-blur-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-base underline underline-offset-4 decoration-primary-hover">Senha</Label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-background/50 backdrop-blur-sm"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <p className="text-sm text-muted-foreground text-center">Use um usuário cadastrado</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
