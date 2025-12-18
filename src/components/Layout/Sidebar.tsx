import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSidebar } from './MainLayout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Shield,
  HardHat,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  PieChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  UserCog,
  Tag,
  Target,
  Factory,
  BarChart4,
  Gift,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const mainMenu = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Chamados', href: '/chamados', icon: Shield },
  { title: 'Gestão de Ativos', href: '/equipamentos', icon: HardHat },
  { title: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { title: 'Análise de Equipamentos', href: '/dashboard/equipamentos', icon: HardHat },
  { title: 'Análise de Serviços', href: '/dashboard/servicos', icon: TrendingUp },
]

const cadastros = [
  { title: 'Usuários', href: '/usuarios', icon: Users },
  { title: 'Produtos', href: '/produtos', icon: Tag },
  { title: 'Setores', href: '/setores', icon: Building2 },
]

const Sidebar = () => {
  const { isCollapsed, toggle } = useSidebar()
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [cadastrosOpen, setCadastrosOpen] = useState(false)
  const isActive = (href: string) => pathname.startsWith(href)
  const anyCadastrosActive = cadastros.some((c) => isActive(c.href))

  return (
    <aside className={cn('fixed left-0 top-0 h-screen bg-primary text-primary-foreground transition-all duration-300 flex flex-col', isCollapsed ? 'w-20' : 'w-64')}>
      <div className="p-6 border-b border-primary-hover flex items-center justify-center">
        <button onClick={toggle} className="w-full">
          <div className="text-center font-extrabold tracking-wide">
            <span className={cn(isCollapsed ? 'text-lg' : 'text-2xl')}>KMZ</span>
          </div>
        </button>
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {(() => {
          if (user?.role === 'admin') return mainMenu
          const isVip = user?.tier === 'vip'
          return mainMenu.filter(m => isVip ? ['/dashboard','/chamados','/dashboard/equipamentos','/dashboard/servicos'].includes(m.href) : m.href === '/chamados')
        })().map((item) => (
          <Link to={item.href} key={item.href}>
            <Button variant="sidebar" className={cn('transition-all duration-300', isActive(item.href) && 'bg-primary-hover')}>
              <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
              {!isCollapsed && <span>{item.title}</span>}
            </Button>
          </Link>
        ))}

        {!isCollapsed ? (
          user?.role === 'admin' && (
            <div className={cn('mt-4 rounded-md')}>
              <Button
                variant="sidebar"
                onClick={() => setCadastrosOpen((v) => !v)}
                className={cn(anyCadastrosActive || cadastrosOpen ? 'bg-primary-hover' : undefined)}
              >
                <Settings className="h-5 w-5 mr-2" />
                <span>Cadastros</span>
                {cadastrosOpen ? <ChevronDown className="h-5 w-5 ml-auto" /> : <ChevronRight className="h-5 w-5 ml-auto" />}
              </Button>
              {cadastrosOpen && (
                <div className="ml-4 mt-2 space-y-2">
                  {cadastros.map((c) => (
                    <Link to={c.href} key={c.href}>
                      <Button variant="ghost" className={cn('w-full justify-start text-primary-foreground hover:bg-primary-hover', isActive(c.href) && 'bg-primary-hover')}>
                        <c.icon className="h-5 w-5 mr-2" />
                        <span>{c.title}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="mt-4 space-y-2">
            {(user?.role === 'admin' ? cadastros : []).map((c) => (
              <Link to={c.href} key={c.href}>
                <Button variant="sidebar" className={cn('transition-all duration-300', isActive(c.href) && 'bg-primary-hover')}>
                  <c.icon className="h-5 w-5" />
                </Button>
              </Link>
            ))}
          </div>
        )}

      </nav>

      <div className="p-4 space-y-2">
        <div className={cn('flex items-center rounded-md p-2 text-sm text-primary-foreground', !isCollapsed ? 'gap-2' : '')}>
          <User className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
          {!isCollapsed && <span>{user?.name || user?.email || 'Usuário'}</span>}
        </div>
        <Separator className="bg-primary-hover" />
        <Button
          variant="sidebar"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className={cn('h-5 w-5', !isCollapsed && 'mr-2')} /> : <Moon className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>}
        </Button>
        <Button
          variant="sidebar"
          onClick={() => { logout(); navigate('/') }}
        >
          <LogOut className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
