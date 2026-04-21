import React, { useState, useRef } from 'react';
import { collection, writeBatch, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, AlertCircle, CheckCircle2, FileJson, Info, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadProps {
  onComplete: () => void;
}

import { handleFirestoreError } from '../../lib/errorHandlers';

export function BulkUpload({ onComplete }: BulkUploadProps) {
  const [data, setData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [loadType, setLoadType] = useState<'ubicado' | 'no-ubicado' | 'sustentado'>('ubicado');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);
        
        // Normalizar nombres de columnas a minúsculas
        const normalized = json.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase().replace(/\s+/g, '');
            // Mapeo inteligente de nombres de columnas comunes
            if (lowerKey.includes('placa')) newRow.placa = row[key];
            else if (lowerKey.includes('descripcion')) newRow.descripcion = row[key];
            else if (lowerKey.includes('marca')) newRow.marca = row[key];
            else if (lowerKey.includes('modelo')) newRow.modelo = row[key];
            else if (lowerKey.includes('serie')) newRow.serie = row[key];
            else if (lowerKey.includes('cta')) newRow.cta = row[key];
            else if (lowerKey.includes('valorreal')) newRow.valorReal = row[key];
            else if (lowerKey.includes('ubicacion')) newRow.ubicacion = row[key];
            else newRow[key] = row[key];
          });
          return newRow;
        });

        setData(JSON.stringify(normalized, null, 2));
        setError('');
      } catch (err: any) {
        setError('Error al leer el archivo Excel: ' + err.message);
      }
    };
    reader.onerror = () => setError('Error al leer el archivo.');
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (!data.trim()) return;
    
    setIsProcessing(true);
    setError('');

    try {
      let parsed: any[];
      try {
        parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) throw new Error('El JSON debe ser un arreglo de objetos.');
      } catch (e: any) {
        throw new Error('Formato de datos inválido. Verifique su entrada. ' + e.message);
      }

      const inventoryRef = collection(db, 'inventory');
      
      const sanitizedData = parsed.map(item => ({
        cta: item.cta?.toString() || "",
        placa: item.placa?.toString() || "S/P",
        descripcion: item.descripcion?.toString() || "Sin descripción",
        marca: item.marca?.toString() || "S/M",
        modelo: item.modelo?.toString() || "S/M",
        serie: item.serie?.toString() || "S/S",
        ubicacion: loadType === 'no-ubicado' ? "NO UBICADO" : (item.ubicacion?.toString() || "CENTRO DE ESTUDIO"),
        estadoCarga: loadType,
        valorAdquisicion: Number(item.valorAdquisicion?.toString().replace(/[^0-9.]/g, "")) || 0,
        depreciacion: Number(item.depreciacion?.toString().replace(/[^0-9.]/g, "")) || 0,
        valorReal: Number(item.valorReal?.toString().replace(/[^0-9.]/g, "")) || 0,
        updatedAt: serverTimestamp(),
      }));

      // Si es modo reemplazo, borramos lo viejo primero (limitado a los primeros 400 por seguridad de batch)
      if (replaceMode) {
        const snapshot = await getDocs(collection(db, 'inventory'));
        const deleteBatch = writeBatch(db);
        snapshot.docs.slice(0, 450).forEach((d) => deleteBatch.delete(d.ref));
        await deleteBatch.commit();
      }

      // Procesar en chunks de 400 para no exceder el límite de 500 de Firestore batches
      const CHUNK_SIZE = 400;
      for (let i = 0; i < sanitizedData.length; i += CHUNK_SIZE) {
        const chunk = sanitizedData.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        chunk.forEach(item => {
          const newDocRef = doc(inventoryRef);
          batch.set(newDocRef, item);
        });
        
        await batch.commit();
      }
      onComplete();
    } catch (err: any) {
      try {
        handleFirestoreError(err, 'write', 'inventory');
      } catch (formattedError: any) {
        setError(formattedError.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center border border-teal-800/50">
              <FileSpreadsheet className="w-5 h-5 text-teal-400" />
           </div>
           <div>
              <h4 className="text-white font-bold text-sm tracking-tight uppercase">Importación Masiva</h4>
              <p className="text-[10px] text-gray-500 font-mono">Carga segmentada por ubicación</p>
           </div>
        </div>

        <div className="flex items-center bg-[#0F1115] border border-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setLoadType('ubicado')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${loadType === 'ubicado' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ubicados
          </button>
          <button 
            onClick={() => setLoadType('no-ubicado')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${loadType === 'no-ubicado' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            No Ubicados
          </button>
          <button 
            onClick={() => setLoadType('sustentado')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${loadType === 'sustentado' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Sustentados
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#1A1D23] border border-gray-800 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-teal-400 hover:border-teal-500/50 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Cargar Excel
          </button>

          <label className="flex items-center gap-3 cursor-pointer group bg-[#0F1115] border border-gray-800 p-3 rounded-xl hover:border-teal-500/50 transition-all">
            <input 
              type="checkbox" 
              checked={replaceMode} 
              onChange={() => setReplaceMode(!replaceMode)}
              className="w-4 h-4 accent-teal-500 rounded border-gray-700 bg-gray-800"
            />
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold text-gray-300 leading-none">Modo Reemplazo</span>
              <span className="text-[9px] text-gray-500 italic leading-none">Borrar datos previos</span>
            </div>
          </label>
        </div>
      </div>

      <div className="relative group">
        <textarea 
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder='Pega aquí tu arreglo JSON o carga un archivo Excel arriba.'
          className="w-full h-80 bg-[#0F1115] border border-gray-800 rounded-2xl p-6 text-[11px] font-mono text-teal-100 placeholder:text-gray-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none shadow-inner"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1 bg-gray-800/80 rounded-full border border-gray-700 backdrop-blur-sm opacity-50 group-hover:opacity-100 transition-opacity">
           <Info className="w-3 h-3 text-teal-400" />
           <span className="text-[9px] font-mono text-gray-400">Datos procesados</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl flex gap-3 text-rose-400 animate-in slide-in-from-right-4 duration-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
             <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Error de Validación</p>
             <p className="text-[11px] font-mono leading-tight opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-gray-800/50">
        <p className="text-[10px] font-mono text-gray-500 max-w-sm text-center md:text-left italic">
           * Asegúrese de que los campos coincidan con el esquema definido para evitar errores de persistencia en la base de datos.
        </p>
        <button 
          disabled={isProcessing || !data.trim()}
          onClick={handleUpload}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-20 text-white font-bold uppercase tracking-[0.2em] py-4 px-16 rounded-2xl shadow-lg shadow-teal-900/20 transition-all flex items-center gap-3 active:scale-[0.98] w-full md:w-auto justify-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando Sincronización...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Sincronización
            </>
          )}
        </button>
      </div>
    </div>
  );
}
