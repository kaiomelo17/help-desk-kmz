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
      <div className="min-h-screen bg-background">
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
