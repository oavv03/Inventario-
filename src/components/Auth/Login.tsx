import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { LogIn, ShieldCheck, Lock, AlertCircle, Database, User as UserIcon, Keyboard } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LoginProps {
  user: User | null;
}

export function Login({ user }: LoginProps) {
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLegacy, setShowLegacy] = useState(true);

  if (user) {
    return <Navigate to="/admin" />;
  }

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    // Credenciales solicitadas por el usuario
    if (username.trim() === 'Admin' && password === '1234') {
      try {
        // Usamos autenticación anónima para permitir el acceso a Firebase
        await signInAnonymously(auth);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
          setError(`⚠️ ACCIÓN REQUERIDA: Debes habilitar el "Proveedor Anónimo" en tu Consola de Firebase (Authentication > Sign-in method > Anónimo > Habilitar). Sin esto, no se puede usar el login Admin/1234.`);
        } else {
          setError("Error de autenticación técnica: " + err.message);
        }
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      setError('Usuario o contraseña incorrectos.');
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión con Google fue cancelado.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleAuthMode = (legacy: boolean) => {
    setError('');
    setShowLegacy(legacy);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1D23] border border-gray-800 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl" />
        
        <div className="relative space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl border border-gray-700 flex items-center justify-center mx-auto shadow-lg mb-6">
              <Lock className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Sistinven Auth</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2 font-mono">Control de Acceso Patrimonial</p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4" />

          {error && (
            <div className="p-4 bg-rose-900/20 border border-rose-800/40 rounded-xl flex gap-3 text-rose-400 items-start animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono leading-relaxed">{error}</p>
            </div>
          )}

          {showLegacy ? (
            <form onSubmit={handleLegacyLogin} className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-500 ml-2 font-mono">Usuario</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Admin"
                      className="w-full bg-[#0F1115] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-500 ml-2 font-mono">Contraseña</label>
                  <div className="relative">
                    <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-[#0F1115] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
               </div>

               <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-teal-900/20 mt-6 font-mono"
              >
                {isLoggingIn ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Iniciar Sesión
              </button>

              <button 
                type="button"
                onClick={() => toggleAuthMode(false)}
                className="w-full text-[10px] text-gray-500 uppercase tracking-widest font-mono hover:text-white transition-colors"
              >
                Usar Google (Seguro)
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all font-mono"
              >
                {isLoggingIn ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                Acceder con Google
              </button>
              
              <button 
                type="button"
                onClick={() => toggleAuthMode(true)}
                className="w-full text-[10px] text-gray-500 uppercase tracking-widest font-mono hover:text-white transition-colors text-center"
              >
                Volver a usuario/pass
              </button>
            </div>
          )}

          <p className="text-gray-500 text-[10px] leading-relaxed max-w-[200px] mx-auto italic font-mono uppercase tracking-tighter opacity-40 text-center pt-4">
            SISTEMA DE CONTROL PATRIMONIAL TRIBUNAL ELECTORAL
          </p>
        </div>
      </div>
    </div>
  );
}
