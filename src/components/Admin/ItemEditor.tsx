import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem } from '../../types';
import { Search, Loader2, AlertCircle, CheckCircle2, Save, X, Hash } from 'lucide-react';
import { handleFirestoreError } from '../../lib/errorHandlers';

export function ItemEditor() {
  const [placaSearch, setPlacaSearch] = useState('');
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchItem = async () => {
    if (!placaSearch.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);

    try {
      const q = query(collection(db, 'inventory'), where('placa', '==', placaSearch.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('No se encontró ningún artículo con esa placa.');
      } else {
        const found = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as InventoryItem;
        setItem(found);
      }
    } catch (err: any) {
      setError('Error al buscar el artículo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'inventory', item.id);
      const updateData = {
        ...item,
        updatedAt: serverTimestamp()
      };
      // @ts-ignore - remove id before update
      delete updateData.id;

      await updateDoc(docRef, updateData);
      setSuccess('Artículo actualizado correctamente.');
    } catch (err: any) {
      try {
        handleFirestoreError(err, 'update', 'inventory');
      } catch (formattedError: any) {
        setError(formattedError.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!item) return;
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  return (
    <div className="flex-1 flex flex-col p-8 space-y-8 animate-in fade-in duration-300">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row items-end gap-4 bg-[#0F1115] border border-gray-800 p-6 rounded-2xl shadow-inner">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Buscar por Placa Patrimonial</label>
          <div className="relative">
             <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/50" />
             <input 
               type="text" 
               placeholder="Ej: 123620"
               value={placaSearch}
               onChange={(e) => setPlacaSearch(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && searchItem()}
               className="w-full bg-[#1A1D23] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono"
             />
          </div>
        </div>
        <button 
          onClick={searchItem}
          disabled={loading || !placaSearch.trim()}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-20 text-white p-3.5 rounded-xl border border-gray-700 transition-all flex items-center justify-center min-w-[120px]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl flex gap-3 text-rose-400 animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono leading-tight">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-teal-950/20 border border-teal-900/30 rounded-xl flex gap-3 text-teal-400 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono leading-tight">{success}</p>
        </div>
      )}

      {/* Edit Form */}
      {item && (
        <form onSubmit={handleUpdate} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Descripción</label>
                 <textarea 
                   name="descripcion"
                   value={item.descripcion}
                   onChange={handleChange}
                   rows={3}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Ubicación Actual</label>
                 <input 
                   name="ubicacion"
                   value={item.ubicacion}
                   onChange={handleChange}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Marca</label>
                 <input 
                   name="marca"
                   value={item.marca}
                   onChange={handleChange}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all uppercase"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Modelo</label>
                 <input 
                   name="modelo"
                   value={item.modelo}
                   onChange={handleChange}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all uppercase"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Serie</label>
                 <input 
                   name="serie"
                   value={item.serie}
                   onChange={handleChange}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">CTA</label>
                 <input 
                   name="cta"
                   value={item.cta}
                   onChange={handleChange}
                   className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all font-mono"
                 />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-gray-800/50">
              <button 
                type="button" 
                onClick={() => setItem(null)}
                className="px-6 py-3 rounded-xl border border-gray-800 text-gray-500 hover:text-white hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-500 text-white px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
           </div>
        </form>
      )}

      {!item && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-30">
           <AlertCircle className="w-12 h-12 mb-4" />
           <p className="text-xs uppercase tracking-widest font-mono">Ingrese una placa patrimonial para iniciar la edición</p>
        </div>
      )}
    </div>
  );
}
