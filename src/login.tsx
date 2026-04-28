import React, { useState } from 'react';
import {
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  SparklesIcon,
  BrainCircuitIcon,
  ActivityIcon,
  TargetIcon,
  AlertCircleIcon,
  Loader2Icon } from
'lucide-react';
import { supabase } from './supabase';
export function Login({ onLoginSuccess }: {onLoginSuccess: () => void;}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: user, error: queryError } = await supabase.
      from('system_users').
      select('id, name, email, role, active, password').
      eq('email', email).
      single();
      if (queryError || !user) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }
      if (!user.active) {
        setError('Este usuario ha sido desactivado');
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setError('');
      onLoginSuccess();
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2D4494] rounded-full blur-[130px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7DB928] rounded-full blur-[130px] opacity-10" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 relative z-10 bg-black/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.6)]">
        {/* IZQUIERDA */}
        <div className="p-12 lg:p-20 flex flex-col justify-between border-r border-white/5">
          <div className="space-y-10">
            <div className="relative flex justify-center items-center py-10">
              <div className="absolute w-[260px] h-[260px] md:w-[300px] md:h-[300px] bg-gradient-radial from-[#2D4494]/40 via-[#7DB928]/30 to-transparent blur-3xl opacity-60" />
              <div className="absolute w-[220px] h-[220px] md:w-[260px] md:h-[260px] rounded-full border border-white/10 backdrop-blur-xl" />
              <img
                src="/unnamed.png"
                alt="Grupo Económico Torres Rodríguez"
                className="relative h-36 md:h-48 lg:h-52 w-auto object-contain drop-shadow-[0_25px_70px_rgba(0,0,0,0.9)]" />
              
            </div>

            <div className="space-y-6 pt-2">
              <BrainCircuitIcon className="text-[#7DB928]/50 mb-4" size={40} />
              <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tighter">
                Portal de <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D4494] to-[#7DB928]">
                  Prueba
                </span>
                <br />
                Psicométrica
              </h1>
              <p className="text-white/60 text-lg max-w-sm font-light">
                Transformando datos en potencial humano con precisión ejecutiva.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-10">
            <div className="flex-1 p-5 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-3">
              <TargetIcon size={24} className="text-[#7DB928]" />
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
                Evaluación Estratégica
              </span>
            </div>
            <div className="flex-1 p-5 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-3">
              <ActivityIcon size={24} className="text-[#2D4494]" />
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
                Análisis en Tiempo Real
              </span>
            </div>
          </div>
        </div>

        {/* DERECHA */}
        <div className="p-12 lg:p-20 bg-white/[0.015] flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-10">
            <div className="space-y-2">
              <span className="flex items-center gap-3 text-[#7DB928] text-[10px] font-bold uppercase tracking-[0.4em] mb-2">
                <SparklesIcon size={14} /> Acceso de Nivel Ejecutivo
              </span>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                Identity Verification
              </h2>
            </div>

            {error &&
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-3 items-start">
                <AlertCircleIcon
                size={20}
                className="text-red-500 flex-shrink-0 mt-0.5" />
              
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            }

            <form className="space-y-8" onSubmit={handleLogin}>
              <div className="group relative">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-transparent border-b-2 border-white/10 py-4 text-white text-lg focus:outline-none focus:border-[#7DB928] transition-all peer placeholder:opacity-0 disabled:opacity-50" />
                
                <label className="absolute left-0 top-4 text-white/30 text-lg pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#7DB928] peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">
                  Email Institucional
                </label>
                <MailIcon
                  className="absolute right-0 top-4 text-white/20 group-focus-within:text-[#7DB928]"
                  size={20} />
                
              </div>

              <div className="group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-transparent border-b-2 border-white/10 py-4 text-white text-lg focus:outline-none focus:border-[#7DB928] transition-all peer placeholder:opacity-0 disabled:opacity-50" />
                
                <label className="absolute left-0 top-4 text-white/30 text-lg pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#7DB928] peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">
                  Contraseña de Acceso
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-0 top-4 text-white/20 group-focus-within:text-[#7DB928] disabled:opacity-50">
                  
                  {showPassword ?
                  <EyeOffIcon size={20} /> :

                  <EyeIcon size={20} />
                  }
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden rounded-full p-[2px] focus:outline-none disabled:opacity-50">
                
                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#2D4494_0%,#7DB928_50%,#2D4494_100%)]" />
                <div className="inline-flex h-14 w-full items-center justify-center rounded-full bg-slate-950/90 px-8 text-sm font-bold text-white backdrop-blur-3xl group-hover:bg-transparent transition-all">
                  {loading ?
                  <>
                      <Loader2Icon className="animate-spin mr-2" size={16} />
                      <span className="tracking-[0.4em] uppercase text-[10px]">
                        Verificando...
                      </span>
                    </> :

                  <>
                      <span className="tracking-[0.4em] uppercase text-[10px]">
                        Access Portal
                      </span>
                      <ArrowRightIcon
                      className="ml-4 group-hover:translate-x-2 transition-transform"
                      size={18} />
                    
                    </>
                  }
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>);

}