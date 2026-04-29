import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Database, LogIn, LogOut, ShieldCheck, LayoutDashboard, Settings, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  user: User | null;
}

export function Layout({ user }: LayoutProps) {
  const handleLogout = () => signOut(auth);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#0F1115] text-[#E2E8F0] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#16191F] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <Database className="w-6 h-6 text-teal-500" />
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Sistinven</h1>
          </Link>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            to="/" 
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
              isActive('/') ? "bg-gray-800 text-teal-400" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Panel General
          </Link>
          
          {user && (
            <Link 
              to="/admin" 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
                isActive('/admin') ? "bg-gray-800 text-teal-400" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              Gestión Admin
            </Link>
          )}
        </nav>

        {user && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 p-2 bg-gray-900 rounded-xl border border-gray-800 group relative">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden ring-2 ring-teal-900/50">
                {user.isAnonymous ? 'AD' : (user.email?.substring(0, 2) || 'US')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.isAnonymous ? 'Administrador Maestro' : (user.displayName || 'Administrador')}
                </p>
                <p className="text-[10px] text-gray-500 truncate lowercase">
                  {user.isAnonymous ? 'Acceso Local' : user.email}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-rose-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div className="p-4 border-t border-gray-800">
             <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-lg text-sm font-bold shadow-lg shadow-teal-900/20 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Acceso Admin
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#12151A] shrink-0">
           <div className="flex items-center gap-4">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 Sincronizado v1.2
              </p>
           </div>
           <div className="flex items-center gap-4">
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 hidden md:block">
                Tribunal Electoral - Dirección Administrativa
              </p>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
