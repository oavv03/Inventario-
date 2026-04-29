import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem } from '../../types';
import { Search, Loader2, AlertCircle, CheckCircle2, Camera, MapPin, Upload, X, Hash, ListRestart, History, Plus, FileText } from 'lucide-react';
import { handleFirestoreError } from '../../lib/errorHandlers';
import { cn } from '../../lib/utils';
import { generateAssetPDF } from '../../lib/pdfGenerator';

export function AssetVerification() {
  const [placaSearch, setPlacaSearch] = useState('');
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [pendingItems, setPendingItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), where('estadoCarga', '==', 'no-ubicado'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      setPendingItems(data);
      setLoadingList(false);
    });
    return () => unsubscribe();
  }, []);

  const selectItem = (selected: InventoryItem) => {
    setItem(selected);
    setPlacaSearch(selected.placa);
    setPreviewUrl(selected.imageUrl || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchItem = async () => {
    if (!placaSearch.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);
    setPreviewUrl(null);

    try {
      // Buscamos cualquier artículo pero resaltaremos si es no-ubicado
      const q = query(collection(db, 'inventory'), where('placa', '==', placaSearch.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('No se encontró ningún artículo con esa placa.');
      } else {
        const found = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as InventoryItem;
        setItem(found);
        if (found.imageUrl) setPreviewUrl(found.imageUrl);
      }
    } catch (err: any) {
      setError('Error al buscar el artículo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // Limit to ~800KB for Firestore doc safety
      setError('La imagen es demasiado pesada. Por favor use una de menos de 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setPreviewUrl(base64);
      if (item) {
        setItem({ ...item, imageUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'inventory', item.id);
      
      // Si el item era no-ubicado, al verificarlo y ponerle ubicación se marca como ubicado
      const updateData: any = {
        ubicacion: item.ubicacion,
        imageUrl: previewUrl || "",
        estadoCarga: item.estadoCarga === 'no-ubicado' ? 'ubicado' : item.estadoCarga,
        isFinding: true,
        findingDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      const updatedItem = { 
        ...item, 
        ubicacion: item.ubicacion,
        estadoCarga: item.estadoCarga === 'no-ubicado' ? 'ubicado' : (item.estadoCarga as any),
        imageUrl: previewUrl || "",
        isFinding: true,
        findingDate: new Date()
      } as InventoryItem;

      setSuccess('Activo verificado y actualizado con éxito.');
      setItem(updatedItem);
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

  return (
    <div className="flex-1 flex flex-col p-8 space-y-10 animate-in fade-in duration-300">
      {/* Header Info */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center border border-indigo-800/50 shadow-inner">
                <Camera className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <h4 className="text-white font-bold text-base tracking-tight uppercase">Control de Hallazgos</h4>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest">Sincronización de activos marcados como No Ubicados</p>
            </div>
          </div>

          <div className="bg-[#0F1115] border border-gray-800 px-6 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Pendientes</span>
                <span className="text-xl font-light text-rose-500 font-mono leading-none">{pendingItems.length}</span>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="w-8 h-8 bg-rose-950/20 rounded-full flex items-center justify-center border border-rose-900/30">
                <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          {/* Search Bar */}
          <div className="bg-[#0F1115] border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Escanear Placa Patrimonial</label>
                {item && (
                   <button onClick={() => { setItem(null); setPlacaSearch(''); }} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest hover:text-white transition-colors">Limpiar búsqueda</button>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                   <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                   <input 
                     type="text" 
                     placeholder="Ingresa la placa del activo hallado..."
                     value={placaSearch}
                     onChange={(e) => setPlacaSearch(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && searchItem()}
                     className="w-full bg-[#1A1D23] border border-gray-700 rounded-2xl py-4 pl-14 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                   />
                </div>
                <button 
                  onClick={searchItem}
                  disabled={loading || !placaSearch.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-900/20 h-[54px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Localizar"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl flex gap-3 text-rose-400 animate-in slide-in-from-right-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-teal-950/20 border border-teal-900/30 rounded-xl flex gap-3 text-teal-400 animate-in slide-in-from-right-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono">{success}</p>
            </div>
          )}

          {item && (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6 duration-500">
               <div className="space-y-6">
                  <div className="bg-[#0F1115] border border-gray-800 p-6 rounded-2xl space-y-6 relative overflow-hidden">
                     <div className="flex justify-between items-center relative z-10">
                        <h5 className="text-white font-bold text-[10px] uppercase tracking-widest opacity-60">Ficha Técnica</h5>
                        <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase border backdrop-blur-md ${
                           item.estadoCarga === 'no-ubicado' 
                           ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                           : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        }`}>
                           {item.estadoCarga === 'no-ubicado' ? 'Item No Ubicado' : 'Ubicación Confirmada'}
                        </span>
                     </div>
                     
                     <div className="space-y-5 relative z-10">
                        <div>
                           <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Descripción General</p>
                           <p className="text-sm text-gray-100 font-medium leading-relaxed">{item.descripcion}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 bg-black/20 p-4 rounded-xl border border-gray-800/50 text-[11px]">
                           <div>
                              <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">Marca / Modelo</p>
                              <p className="text-gray-300 truncate">{item.marca} / {item.modelo}</p>
                           </div>
                           <div>
                              <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">Número de Serie</p>
                              <p className="text-gray-300 font-mono truncate">{item.serie}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        Validar Ubicación
                     </label>
                     <input 
                       name="ubicacion"
                       value={item.ubicacion}
                       onChange={(e) => setItem({ ...item, ubicacion: e.target.value })}
                       placeholder="Confirmar sala, piso o departamento..."
                       className="w-full bg-[#0F1115] border border-gray-800 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all uppercase placeholder:text-gray-700"
                     />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Confirmar Hallazgo
                  </button>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                     <Camera className="w-3.5 h-3.5 text-indigo-400" />
                     Foto de Verificación
                  </label>
                  
                  <div 
                    className="relative aspect-square md:aspect-auto md:h-full rounded-2xl border-2 border-dashed border-gray-800 bg-[#0F1115] overflow-hidden group transition-all hover:border-indigo-500/50 flex flex-col items-center justify-center cursor-pointer shadow-inner min-h-[300px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                     {previewUrl ? (
                        <>
                           <img src={previewUrl} alt="Visualización" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-3 backdrop-blur-sm">
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                 <Upload className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">Sustituir Foto</p>
                           </div>
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
                             className="absolute top-4 right-4 w-8 h-8 bg-rose-600 hover:bg-rose-500 rounded-full text-white shadow-xl flex items-center justify-center transition-all active:scale-90"
                           >
                              <X className="w-4 h-4" />
                           </button>
                        </>
                     ) : (
                        <div className="text-center p-8 space-y-4">
                           <div className="w-20 h-20 bg-gray-800/30 rounded-full flex items-center justify-center mx-auto border border-gray-800/50 shadow-inner">
                              <Camera className="w-10 h-10 text-gray-600" />
                           </div>
                           <div>
                              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Registrar Captura</p>
                              <p className="text-[9px] text-gray-600 font-mono mt-2 uppercase max-w-[160px] mx-auto leading-relaxed">Soporta carga directa de dispositivo o archivo local</p>
                           </div>
                        </div>
                     )}
                     <input 
                       type="file" 
                       ref={fileInputRef}
                       onChange={handleFileChange}
                       accept="image/*"
                       className="hidden"
                     />
                  </div>
               </div>
            </form>
          )}

          {!item && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-32 text-center bg-[#0F1115]/50 border border-dashed border-gray-800/50 rounded-[40px] opacity-40">
               <div className="w-24 h-24 bg-gray-800/20 rounded-full flex items-center justify-center mb-8">
                  <ListRestart className="w-12 h-12 text-gray-700 animate-spin-slow" />
               </div>
               <p className="text-[11px] uppercase tracking-[0.5em] font-mono text-gray-400">Escanee una placa del listado lateral</p>
            </div>
          )}
        </div>

        {/* Pending List Sidebar */}
        <div className="bg-[#0F1115] border border-gray-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl h-[calc(100vh-320px)] min-h-[500px]">
           <div className="p-6 border-b border-gray-800 bg-[#15181D]">
              <div className="flex items-center gap-3">
                 <History className="w-4 h-4 text-rose-500" />
                 <h5 className="text-white font-bold text-[11px] uppercase tracking-widest">Activos No Ubicados</h5>
              </div>
              <p className="text-[9px] text-gray-600 italic mt-1 uppercase font-mono">Pendientes de confirmación física</p>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingList ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-20">
                   <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                   <span className="text-[9px] font-bold uppercase tracking-widest">Cargando lista...</span>
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="p-10 text-center space-y-3 opacity-20">
                   <CheckCircle2 className="w-10 h-10 mx-auto text-teal-500" />
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">¡Todo el inventario<br/>está verificado!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                   {pendingItems.map((pi) => (
                      <button 
                        key={pi.id} 
                        onClick={() => selectItem(pi)}
                        className={cn(
                          "w-full p-5 text-left transition-all hover:bg-gray-800/30 group relative flex items-start gap-4",
                          item?.id === pi.id ? "bg-indigo-900/10 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                        )}
                      >
                         <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0 border border-gray-700/50 text-gray-500 font-mono text-[10px] group-hover:bg-indigo-900/20 group-hover:text-indigo-400 transition-colors">
                            {pi.placa.slice(-4)}
                         </div>
                         <div className="space-y-1 min-w-0">
                            <p className="text-[11px] text-gray-300 font-bold group-hover:text-white transition-colors truncate">{pi.placa}</p>
                            <p className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors truncate uppercase font-mono leading-none tracking-tighter">{pi.descripcion}</p>
                         </div>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-indigo-500" />
                         </div>
                      </button>
                   ))}
                </div>
              )}
           </div>

           <div className="p-4 bg-black/20 text-center border-t border-gray-800">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Sincronización en tiempo real</p>
           </div>
        </div>
      </div>
    </div>
  );
}
