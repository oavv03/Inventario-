import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem } from '../../types';
import { Search, Loader2, Package, Camera, MapPin, Calendar, FileText, ExternalLink, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateAssetPDF, generateFindingsSummaryPDF } from '../../lib/pdfGenerator';
import { format } from 'date-fns';

export function FindingList() {
  const [findings, setFindings] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'inventory'), 
      where('isFinding', '==', true),
      orderBy('findingDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      setFindings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredFindings = findings.filter(f => 
    f.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-teal-900/30 rounded-2xl flex items-center justify-center border border-teal-800/40 shadow-inner">
              <Package className="w-6 h-6 text-teal-400" />
           </div>
           <div>
              <h4 className="text-white font-bold text-lg tracking-tight uppercase">Log de Hallazgos</h4>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Historial de activos recuperados y verificados</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {filteredFindings.length > 0 && (
             <button 
               onClick={() => generateFindingsSummaryPDF(filteredFindings)}
               className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-teal-900/40 border border-teal-500/50 mr-2"
             >
                <FileText className="w-4 h-4" />
                Descargar Reporte General
             </button>
           )}
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar en hallazgos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0F1115] border border-gray-800 rounded-xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 transition-all min-w-[280px]"
              />
           </div>
           <div className="bg-[#0F1115] border border-gray-800 px-5 py-2 rounded-xl flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Total Hallados</span>
              <span className="text-lg font-mono text-teal-400 leading-none">{findings.length}</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 opacity-30">
           <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
           <p className="text-[10px] uppercase font-mono tracking-[0.3em]">Cargando historial de hallazgos...</p>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center bg-[#0F1115]/50 border border-dashed border-gray-800/50 rounded-[40px] opacity-40">
           <div className="w-20 h-20 bg-gray-800/20 rounded-full flex items-center justify-center mb-6">
              <Filter className="w-10 h-10 text-gray-700" />
           </div>
           <p className="text-[11px] uppercase tracking-[0.2em] font-mono text-gray-400">
             {searchTerm ? "No se encontraron coincidencias para tu búsqueda" : "Aún no se han registrado hallazgos en el sistema"}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredFindings.map((item) => (
              <div 
                key={item.id} 
                className="group bg-[#0F1115] border border-gray-800 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all hover:shadow-xl hover:shadow-teal-900/10 flex flex-col"
              >
                 {/* Image Preview */}
                 <div className="aspect-video bg-[#15181D] relative overflow-hidden">
                    {item.imageUrl ? (
                       <img 
                         src={item.imageUrl} 
                         alt={item.placa} 
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                         onClick={() => setSelectedImage(item.imageUrl || null)}
                       />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center opacity-10">
                          <Camera className="w-12 h-12" />
                       </div>
                    )}
                    <div className="absolute top-3 left-3">
                       <span className="bg-teal-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-widest">HALLAZGO</span>
                    </div>
                 </div>

                 {/* Info */}
                 <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="space-y-1">
                       <p className="text-white font-bold text-xs tracking-tight group-hover:text-teal-400 transition-colors uppercase truncate">{item.descripcion}</p>
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-500">{item.placa}</span>
                          <span className="w-1 h-1 bg-gray-800 rounded-full" />
                          <span className="text-[9px] text-gray-600 uppercase font-bold">{item.serie || 'SIN SERIE'}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-800/50">
                       <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-gray-400 leading-tight uppercase font-medium">{item.ubicacion}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-teal-500 shrink-0" />
                          <p className="text-[10px] text-gray-500 font-mono">
                             {item.findingDate ? format(item.findingDate.toDate ? item.findingDate.toDate() : new Date(item.findingDate), 'dd/MM/yyyy HH:mm') : '---'}
                          </p>
                       </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                       <button 
                         onClick={() => generateAssetPDF(item)}
                         className="flex-1 bg-gray-800/50 hover:bg-teal-600 hover:text-white border border-gray-700/50 hover:border-teal-500 px-3 py-2 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-2 text-gray-400"
                       >
                          <FileText className="w-3 h-3" />
                          Reporte PDF
                       </button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
           <button 
             className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
             onClick={() => setSelectedImage(null)}
           >
              <ExternalLink className="w-5 h-5" />
           </button>
           <img 
             src={selectedImage} 
             alt="Enlarged" 
             className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" 
           />
        </div>
      )}
    </div>
  );
}
