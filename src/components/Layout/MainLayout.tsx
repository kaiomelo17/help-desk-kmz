import { createContext, useContext, useMemo, useState } from 'react'
import Sidebar from './Sidebar'

interface SidebarContextValue {
  isCollapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({ isCollapsed: false, toggle: () => {} })

export const useSidebar = () => useContext(SidebarContext)

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const value = useMemo(() => ({ isCollapsed, toggle: () => setIsCollapsed((v) => !v) }), [isCollapsed])

  return (
    <SidebarContext.Provider value={value}>
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-2 right-2 z-[100] opacity-30 text-[10px] font-bold pointer-events-none select-none text-foreground">
          kmz
        </div>
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

export default MainLayout
