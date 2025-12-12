import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, LogIn, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        const { user, error } = await api.login(email, password);
        if (error) {
            setError(error);
        } else if (user) {
            onLogin(user);
        }
    } catch (err) {
        setError("Errore di connessione al database. Riprova.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white text-center">
           <div className="flex justify-center mb-4">
               <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-inner">
                   <ShieldCheck size={48} />
               </div>
           </div>
           <h1 className="text-2xl font-bold mb-1 tracking-tight">UniCensus Facility PRO</h1>
           <p className="text-blue-200 text-sm font-medium">Portale Gestione Infrastrutture</p>
        </div>

        <div className="p-8">
           <form onSubmit={handleLogin} className="space-y-6">
               
               {error && (
                   <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center border border-red-100">
                       <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                       {error}
                   </div>
               )}

               <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Utente</label>
                   <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome.cognome@uni.edu"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                   <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                   />
               </div>

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isLoading ? (
                     <Loader2 size={20} className="animate-spin mr-2" />
                 ) : (
                     <LogIn size={20} className="mr-2" />
                 )}
                 {isLoading ? 'Verifica credenziali...' : 'Accedi al Portale'}
               </button>
           </form>
           
           <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                 Accesso riservato ad Amministratori e Utenti Autorizzati.<br/>
                 Le credenziali sono gestite centralmente.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};