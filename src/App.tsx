import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AnaliseEquipamentos from "./pages/AnaliseEquipamentos";
import AnaliseServicos from "./pages/AnaliseServicos";
import Equipamentos from "./pages/Equipamentos";
import Chamados from "./pages/Chamados";
import Usuarios from "./pages/Usuarios";
import Produtos from "./pages/Produtos";
import Setores from "./pages/Setores";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import { supabase } from "./lib/supabase";
import { useEffect } from "react";
import { toast } from "sonner";
 

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />
  const path = window.location.pathname
  const isAdmin = user?.role === 'admin'
  const isVip = user?.tier === 'vip' && !isAdmin
  if (!isAdmin) {
    const allowed = isVip ? ['/dashboard', '/chamados', '/dashboard/equipamentos', '/dashboard/servicos'] : ['/chamados']
    if (!allowed.includes(path)) {
      return <Navigate to="/chamados" />
    }
  }
  return <MainLayout>{children}</MainLayout>
};

const App = () => {
  useEffect(() => {
    (async () => {
      try {
        const verifyOnStart = (import.meta.env.VITE_SUPABASE_VERIFY_ON_START ?? '0') === '1'
        if (!verifyOnStart) return
        const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE ?? '1') !== '0'
        if (!supabaseEnabled) {
          toast.info("Supabase desativado em desenvolvimento");
          return
        }
        const urlOk = Boolean(import.meta.env.VITE_SUPABASE_URL)
        const keyOk = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
        if (!urlOk || !keyOk) {
          toast.error("Env Supabase ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
          return
        }
        if (!supabase) {
          toast.error("Cliente Supabase não inicializado");
          return
        }
        const { error } = await supabase.from("produtos").select("id").limit(1)
        if (error) {
          toast.error("Conectado, mas schema não visível na API. Aplique supabase/schema.sql e resete o API cache.");
        }
      } catch {
        toast.error("Conexão Supabase indisponível");
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/equipamentos" element={<ProtectedRoute><AnaliseEquipamentos /></ProtectedRoute>} />
              <Route path="/dashboard/servicos" element={<ProtectedRoute><AnaliseServicos /></ProtectedRoute>} />
              <Route path="/equipamentos" element={<ProtectedRoute><Equipamentos /></ProtectedRoute>} />
              <Route path="/chamados" element={<ProtectedRoute><Chamados /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
              <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
              <Route path="/setores" element={<ProtectedRoute><Setores /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
