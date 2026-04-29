import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InventoryItem } from '../../types';
import { Plus, Loader2, AlertCircle, CheckCircle2, Save, X, Hash } from 'lucide-react';
import { handleFirestoreError } from '../../lib/errorHandlers';

export function AddAsset() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    cta: '',
    placa: '',
    descripcion: '',
    marca: '',
    modelo: '',
    serie: '',
    ubicacion: 'CENTRO DE ESTUDIO',
    fecha: new Date().toISOString().split('T')[0],
    valorAdquisicion: 0,
    depreciacion: 0,
    valorReal: 0,
    estadoCarga: 'ubicado'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    if (!formData.placa || !formData.descripcion) {
      setError('La placa y la descripción son campos obligatorios.');
      setIsSaving(false);
      return;
    }

    try {
      // Verificar si la placa ya existe
      const q = query(collection(db, 'inventory'), where('placa', '==', formData.placa));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setError(`La placa ${formData.placa} ya existe en el sistema.`);
        setIsSaving(false);
        return;
      }

      await addDoc(collection(db, 'inventory'), {
        ...formData,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Activo añadido correctamente al inventario.');
      setFormData({
        cta: '',
        placa: '',
        descripcion: '',
        marca: '',
        modelo: '',
        serie: '',
        ubicacion: 'CENTRO DE ESTUDIO',
        fecha: new Date().toISOString().split('T')[0],
        valorAdquisicion: 0,
        depreciacion: 0,
        valorReal: 0,
        estadoCarga: 'ubicado'
      });
    } catch (err: any) {
      try {
        handleFirestoreError(err, 'create', 'inventory');
      } catch (formattedError: any) {
        setError(formattedError.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? Number(value) : value 
    });
  };

  return (
    <div className="flex-1 flex flex-col p-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-900/30 rounded-lg flex items-center justify-center border border-teal-800/50">
              <Plus className="w-5 h-5 text-teal-400" />
           </div>
           <div>
              <h4 className="text-white font-bold text-sm tracking-tight uppercase">Nuevo Activo</h4>
              <p className="text-[10px] text-gray-500 font-mono">Registro manual de bienes patrimoniales</p>
           </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl flex gap-3 text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono leading-tight">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-teal-950/20 border border-teal-900/30 rounded-xl flex gap-3 text-teal-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono leading-tight">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Placa Patrimonial *</label>
            <input 
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              placeholder="Ej: 101349"
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all font-mono"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Descripción del Bien *</label>
            <input 
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: COMPUTADORA PORTATIL"
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all uppercase"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Marca</label>
            <input 
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all uppercase"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Modelo</label>
            <input 
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all uppercase"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Serie</label>
            <input 
              name="serie"
              value={formData.serie}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Ubicación</label>
            <input 
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">CTA</label>
            <input 
              name="cta"
              value={formData.cta}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Categoría</label>
            <select 
              name="estadoCarga"
              value={formData.estadoCarga}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all"
            >
              <option value="ubicado">Ubicados</option>
              <option value="no-ubicado">No Ubicados</option>
              <option value="sustentado">Sustentados</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Valor Adquisición</label>
            <input 
              type="number"
              name="valorAdquisicion"
              value={formData.valorAdquisicion}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Depreciación</label>
            <input 
              type="number"
              name="depreciacion"
              value={formData.depreciacion}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Valor Real</label>
            <input 
              type="number"
              name="valorReal"
              value={formData.valorReal}
              onChange={handleChange}
              className="w-full bg-[#0F1115] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-all font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800/50">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-500 text-white px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Añadir Activo
          </button>
        </div>
      </form>
    </div>
  );
}
