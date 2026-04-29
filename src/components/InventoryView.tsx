import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InventoryItem } from '../types';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Box, Package, Archive, AlertCircle, Camera, Eye, X } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError } from '../lib/errorHandlers';

export function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const itemsPerPage = 12;

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('placa', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as InventoryItem[];
        setItems(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        try {
          handleFirestoreError(err, 'list', 'inventory');
        } catch (formattedError: any) {
          setError(formattedError.message);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => 
    item.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cta?.toString().includes(searchTerm)
  );

  const paginatedItems = filteredItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1A1D23] p-5 rounded-2xl border border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
            <Package className="w-3 h-3 text-teal-400" />
            Total Bienes
          </p>
          <p className="text-3xl font-light text-white leading-none">{items.length}</p>
          <div className="mt-2 text-[10px] text-teal-400 font-mono">Control Patrimonial</div>
        </div>
        
        <div className="bg-[#1A1D23] p-5 rounded-2xl border border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Valor de Stock</p>
          <p className="text-3xl font-light text-white leading-none">
            {formatCurrency(items.reduce((acc, item) => acc + (item.valorReal || 0), 0))}
          </p>
          <div className="mt-2 text-[10px] text-gray-500 font-mono italic">Actualizado {new Date().toLocaleDateString()}</div>
        </div>

        <div className="bg-[#1A1D23] p-5 rounded-2xl border border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
            <Archive className="w-3 h-3 text-amber-500" />
            Depreciación
          </p>
          <p className="text-3xl font-light text-white leading-none">
             {formatCurrency(items.reduce((acc, item) => acc + (item.depreciacion || 0), 0))}
          </p>
          <div className="mt-2 text-[10px] text-amber-500 font-mono">Valor Acumulado</div>
        </div>

        <div className="bg-[#1A1D23] p-5 rounded-2xl border border-gray-800 shadow-sm border-dashed lg:block">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
            <Camera className="w-3 h-3 text-indigo-400" />
            Con Foto
          </p>
          <p className="text-3xl font-light text-white leading-none">{items.filter(i => i.imageUrl).length}</p>
          <div className="mt-2 text-[10px] text-gray-400 font-mono">Evidencia Registrada</div>
        </div>
      </section>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Evidencia del activo" className="w-full h-full object-contain bg-black" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white"
              >
                 <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <section className="bg-[#1A1D23] rounded-2xl border border-gray-800 flex flex-col shadow-xl overflow-hidden min-h-[600px]">
        {/* Table Header / Controls */}
        <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1D2128]">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
            Inventario de Bienes
            <span className="text-[10px] font-mono font-normal opacity-40 ml-2">Total de {filteredItems.length} registros</span>
          </h3>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por placa, descripción..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full bg-[#1A1D23] border border-gray-700 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-gray-300 focus:outline-none focus:border-teal-500 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="p-12 max-w-2xl mx-auto">
              <div className="bg-rose-950/20 border border-rose-900/30 p-8 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-500">
                  <AlertCircle className="w-6 h-6" />
                  <h4 className="font-bold uppercase tracking-widest text-sm">Error de Acceso</h4>
                </div>
                <div className="bg-[#0F1115] p-4 rounded-xl border border-rose-900/10">
                   <p className="text-[10px] font-mono text-rose-300 leading-relaxed overflow-auto max-h-40">
                      {error}
                   </p>
                </div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter italic">
                  Si este error persiste y usted es administrador, verifique que su correo esté autorizado en las reglas de seguridad.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-4 opacity-20">
              <Box className="w-16 h-16 animate-pulse" />
              <p className="text-xs uppercase tracking-[0.4em] font-mono">Procesando Inventario</p>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="p-24 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-xs uppercase tracking-widest font-mono text-gray-500 animate-pulse">No se encontraron registros para la búsqueda</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0F1115] sticky top-0 z-10 border-b border-gray-800">
              <tr className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4 font-mono">CTA</th>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Serie</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              <AnimatePresence mode="popLayout">
                {paginatedItems.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{item.cta}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-700 font-mono">
                          {item.placa}
                        </span>
                        {item.imageUrl && (
                          <button 
                            onClick={() => setSelectedImage(item.imageUrl!)}
                            className="p-1 bg-indigo-950/30 text-indigo-400 rounded-md border border-indigo-900/30 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title="Ver Foto"
                          >
                             <Camera className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-white group-hover:text-teal-400 transition-colors">
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {item.marca}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">
                      {item.modelo}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">
                      {item.serie}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="bg-teal-900/20 text-teal-400 px-2 py-0.5 rounded-full text-[9px] font-bold border border-teal-800/30 uppercase tracking-tighter">
                         Patrimonial
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          )}
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-gray-900/30 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
          <p>Página {page + 1} de {totalPages || 1}</p>
          <div className="flex gap-6 items-center">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="hover:text-white transition-all disabled:opacity-20 flex items-center gap-1 group"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Anterior
            </button>
            <div className="h-4 w-px bg-gray-800" />
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="hover:text-teal-400 transition-all disabled:opacity-20 flex items-center gap-1 group"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
