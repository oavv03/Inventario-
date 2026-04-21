import { useState, useEffect } from 'react';
import { collection, writeBatch, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem } from '../../types';
import { Upload, Trash2, CheckCircle2, AlertTriangle, RefreshCcw, FileSpreadsheet, ShieldCheck, Database, History } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { BulkUpload } from './BulkUpload';
import { ItemEditor } from './ItemEditor';
import { Search as SearchIcon } from 'lucide-react';

import { handleFirestoreError } from '../../lib/errorHandlers';

export function AdminDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'idle' | 'bulk' | 'edit'>('idle');
  const [summary, setSummary] = useState<{ total: number; ubicados: number; noUbicados: number; sustentados: number; latest: InventoryItem | null }>({ 
    total: 0, 
    ubicados: 0, 
    noUbicados: 0, 
    sustentados: 0,
    latest: null 
  });

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const items = snapshot.docs.map(d => d.data() as InventoryItem);
      
      const ubicadosCount = items.filter(i => i.estadoCarga === 'ubicado').length;
      const noUbicadosCount = items.filter(i => i.estadoCarga === 'no-ubicado').length;
      const sustentadosCount = items.filter(i => i.estadoCarga === 'sustentado').length;
      
      const q = query(collection(db, 'inventory'), orderBy('updatedAt', 'desc'), limit(1));
      const latestSnap = await getDocs(q);
      
      setSummary({
        total: snapshot.size,
        ubicados: ubicadosCount,
        noUbicados: noUbicadosCount,
        sustentados: sustentadosCount,
        latest: latestSnap.docs[0]?.data() as InventoryItem || null
      });
    } catch (err: any) {
      handleFirestoreError(err, 'list', 'inventory');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const clearDatabase = async () => {
    if (!confirm('¿ESTÁ SEGURO? Esta acción ELIMINARÁ TODOS los datos del inventario permanentemente.')) return;
    
    setIsUploading(true);
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      await fetchStats();
      alert('Base de datos vaciada con éxito.');
    } catch (err: any) {
      handleFirestoreError(err, 'delete', 'inventory');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-teal-500" />
             Panel de Administración
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-2">Control Maestro de Inventario Patrimonial</p>
        </div>
        
        <div className="flex gap-3">
           <button 
             onClick={fetchStats}
             className="p-2.5 bg-gray-800 border border-gray-700 text-gray-400 rounded-xl hover:text-white hover:border-gray-500 transition-all shadow-sm"
             title="Refrescar Estadísticas"
           >
             <RefreshCcw className="w-4 h-4" />
           </button>

           <button 
            onClick={() => setActiveTab(activeTab === 'edit' ? 'idle' : 'edit')}
            className={cn(
              "text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl border transition-all flex items-center gap-3 shadow-lg shadow-teal-900/10",
              activeTab === 'edit'
                ? "bg-amber-600 border-amber-500 text-white" 
                : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
            )}
          >
            <SearchIcon className="w-4 h-4" />
            {activeTab === 'edit' ? 'Cerrar Edición' : 'Buscar y Editar'}
          </button>

           <button 
            onClick={() => setActiveTab(activeTab === 'bulk' ? 'idle' : 'bulk')}
            className={cn(
              "text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl border transition-all flex items-center gap-3 shadow-lg shadow-teal-900/10",
              activeTab === 'bulk'
                ? "bg-teal-600 border-teal-500 text-white" 
                : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
            )}
          >
            <Upload className="w-4 h-4" />
            {activeTab === 'bulk' ? 'Cerrar Importación' : 'Importar Datos'}
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-[#1A1D23] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Total General</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{summary.total}</span>
            <span className="text-[10px] text-teal-400 font-mono">Ítems</span>
          </div>
        </div>

        <div className="bg-[#1A1D23] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Ubicados</p>
           </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{summary.ubicados}</span>
          </div>
        </div>

        <div className="bg-[#1A1D23] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">No Ubicados</p>
           </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{summary.noUbicados}</span>
          </div>
        </div>

        <div className="bg-[#1A1D23] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Sustentados</p>
           </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{summary.sustentados}</span>
          </div>
        </div>

        <div className="bg-[#1A1D23] p-6 rounded-2xl border border-gray-800 shadow-xl relative border-l-[4px] border-l-rose-600/50">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Acciones</p>
          <button 
            disabled={isUploading}
            onClick={clearDatabase}
            className="w-full bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-20 text-left group"
          >
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest">Vaciar Base</span>
                <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
             </div>
          </button>
        </div>
      </section>

      {/* Main Action Area */}
      <section className="bg-[#1A1D23] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden min-h-[300px] flex flex-col">
        {activeTab === 'bulk' ? (
          <BulkUpload onComplete={() => { fetchStats(); setActiveTab('idle'); }} />
        ) : activeTab === 'edit' ? (
          <ItemEditor />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-800/50 rounded-3xl border border-gray-700/50 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-10 h-10 text-gray-600" />
             </div>
             <div className="max-w-md">
                <h4 className="text-white font-bold uppercase tracking-widest mb-2">Editor Administrativo</h4>
                <p className="text-xs text-gray-500 font-mono leading-relaxed">
                  Utilice las herramientas superiores para gestionar la persistencia de los datos patrimoniales. 
                  Se recomienda realizar respaldos manuales periódicos.
                </p>
             </div>
          </div>
        )}
      </section>

      {/* Critical Info */}
      <section className="bg-amber-950/10 border border-amber-900/20 p-6 rounded-2xl flex items-start gap-5">
         <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
         <div>
            <h5 className="text-amber-500 font-bold uppercase text-xs tracking-widest mb-1 leading-none">Aviso de Seguridad</h5>
            <p className="text-[11px] text-gray-500 font-mono leading-relaxed uppercase tracking-tighter">
              El reemplazo de datos es una operación crítica que sincroniza la base de datos de producción con el contenido cargado. Asegúrese de que el formato JSON sea válido para evitar inconsistencias en las placas patrimoniales.
            </p>
         </div>
      </section>
    </div>
  );
}
