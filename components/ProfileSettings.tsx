import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCircle, Key, Lock, CheckCircle2, AlertTriangle, Loader2, Save } from 'lucide-react';
import { api } from '../services/api';

interface ProfileSettingsProps {
  user: User;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'La password deve essere di almeno 6 caratteri.' });
        return;
    }

    if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Le password non coincidono.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const { success, error } = await api.changePassword(newPassword);
        if (success) {
            setMessage({ type: 'success', text: 'Password aggiornata con successo! Usala al prossimo login.' });
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMessage({ type: 'error', text: error || 'Errore durante l\'aggiornamento.' });
        }
    } catch (err) {
        setMessage({ type: 'error', text: 'Errore di connessione.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <UserCircle size={32} />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-slate-800">Profilo & Impostazioni</h2>
              <p className="text-slate-500 text-sm">Gestisci il tuo account e la sicurezza.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card Dettagli Utente */}
          <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-blue-500" />
                      Dettagli Ruolo
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Utente</label>
                          <p className="font-medium text-slate-700">{user.name}</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                          <p className="font-medium text-slate-700 break-all">{user.email}</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ruolo</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                              {user.role}
                          </span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Form Cambio Password */}
          <div className="md:col-span-2">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Key size={20} className="text-orange-500" />
                      Sicurezza Account
                  </h3>

                  <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                      {message && (
                          <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                              {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                              {message.text}
                          </div>
                      )}

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nuova Password</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                      <Lock size={16} />
                                  </div>
                                  <input 
                                      type="password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                      placeholder="••••••••"
                                      required
                                  />
                              </div>
                              <p className="text-xs text-slate-400 mt-1">Minimo 6 caratteri.</p>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Conferma Password</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                      <Lock size={16} />
                                  </div>
                                  <input 
                                      type="password"
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                      placeholder="••••••••"
                                      required
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button 
                              type="submit" 
                              disabled={isSubmitting || !newPassword || !confirmPassword}
                              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                          >
                              {isSubmitting ? (
                                  <>
                                      <Loader2 size={18} className="animate-spin mr-2" />
                                      Aggiornamento...
                                  </>
                              ) : (
                                  <>
                                      <Save size={18} className="mr-2" />
                                      Aggiorna Password
                                  </>
                              )}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
};