import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserCircle, Key, Lock, CheckCircle2, AlertTriangle, Loader2, Save, Users, Plus, Trash2, Eye, LayoutDashboard, CheckSquare, ClipboardList, Hammer, Calendar, FileText, Archive, Globe, Database, Copy } from 'lucide-react';
import { api, Viewer } from '../services/api';

interface ControlPanelProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const VIEW_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'census', label: 'Gestione Ville & Sedi', icon: CheckSquare },
    { id: 'tickets', label: 'Ticket Manutenzione', icon: ClipboardList },
    { id: 'work_requests', label: 'Work Requests', icon: Hammer },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'activity_log', label: 'Registro Attività', icon: FileText },
    { id: 'tickets_archive', label: 'Archivio Ticket', icon: Archive }
];

// SQL snippet specific for fixing this table
const VISITOR_TABLE_SQL = `
-- Crea tabella se non esiste
create table if not exists authorized_viewers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  password text,
  permissions text,
  created_at timestamptz default now()
);

-- AGGIORNAMENTO: Aggiunge colonne se mancano (per tabelle vecchie)
alter table authorized_viewers add column if not exists password text;
alter table authorized_viewers add column if not exists permissions text;

-- Disabilita sicurezza RLS per evitare blocchi
alter table authorized_viewers disable row level security;
`;

export const ControlPanel: React.FC<ControlPanelProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'visitors'>('profile');
  
  // Profile State
  const [newName, setNewName] = useState(user.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Visitors State
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
  // Add Visitor Form State
  const [newViewerEmail, setNewViewerEmail] = useState('');
  const [newViewerName, setNewViewerName] = useState('');
  const [newViewerPassword, setNewViewerPassword] = useState('');
  const [newViewerPermissions, setNewViewerPermissions] = useState<string[]>(['dashboard']); // Default dashboard
  const [isAddingViewer, setIsAddingViewer] = useState(false);

  // Load Viewers on Mount (if admin)
  useEffect(() => {
    if (user.role === 'ADMIN' && activeTab === 'visitors') {
        loadViewers();
    }
  }, [user.role, activeTab]);

  const loadViewers = async () => {
      setIsLoadingViewers(true);
      try {
          const list = await api.getViewers();
          setViewers(list);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingViewers(false);
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSubmittingProfile(true);

    try {
        let successCount = 0;
        if (newName !== user.name) {
            const res = await api.updateProfileName(newName);
            if (!res.success) throw new Error(res.error || 'Errore nome');
            onUpdateUser({ ...user, name: newName });
            successCount++;
        }
        if (newPassword) {
            if (newPassword.length < 6) throw new Error('Password troppo corta (min 6)');
            if (newPassword !== confirmPassword) throw new Error('Le password non coincidono');
            const res = await api.changePassword(newPassword);
            if (!res.success) throw new Error(res.error || 'Errore password');
            setNewPassword('');
            setConfirmPassword('');
            successCount++;
        }
        if (successCount > 0) {
            setProfileMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
        } else {
             setProfileMessage({ type: 'error', text: 'Nessuna modifica rilevata.' });
        }
    } catch (err: any) {
        setProfileMessage({ type: 'error', text: err.message || 'Errore aggiornamento.' });
    } finally {
        setIsSubmittingProfile(false);
    }
  };

  const handleTogglePermission = (viewId: string) => {
      setNewViewerPermissions(prev => 
         prev.includes(viewId) ? prev.filter(p => p !== viewId) : [...prev, viewId]
      );
  };

  const handleAddViewer = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newViewerPassword.length < 4) {
          alert("La password deve avere almeno 4 caratteri.");
          return;
      }
      setIsAddingViewer(true);
      try {
          await api.addViewer(newViewerEmail, newViewerName, newViewerPassword, newViewerPermissions);
          setNewViewerEmail('');
          setNewViewerName('');
          setNewViewerPassword('');
          setNewViewerPermissions(['dashboard']);
          loadViewers(); // Reload list from DB
          alert("Utente creato correttamente nel database Cloud.");
      } catch (error: any) {
          console.error("Add Visitor Error:", error);
          
          // GESTIONE ERRORI SPECIFICA
          const msg = error.message || JSON.stringify(error);
          
          if (msg.includes("duplicate key") || error.code === '23505') {
              alert("ERRORE: Questa email esiste già nel database.");
          } 
          else if (msg.includes("column") || error.code === '42703') {
              alert("ERRORE DATABASE: La tabella 'authorized_viewers' non ha le colonne 'password' o 'permissions'.\n\nClicca sul pulsante 'Script DB' qui sotto, copia il codice e eseguilo nell'SQL Editor di Supabase per aggiornare la tabella.");
              setShowSqlHelp(true);
          } 
          else {
              alert(`Errore imprevisto: ${msg}`);
          }
      } finally {
          setIsAddingViewer(false);
      }
  };

  const handleDeleteViewer = async (id: string) => {
      if(!confirm("Rimuovere questo utente dal database? Non potrà più accedere da nessun dispositivo.")) return;
      try {
          await api.deleteViewer(id);
          setViewers(prev => prev.filter(v => v.id !== id));
      } catch(e) {
          alert("Errore eliminazione.");
      }
  };

  const copySql = () => {
      navigator.clipboard.writeText(VISITOR_TABLE_SQL);
      alert("Codice SQL copiato! Incollalo nell'SQL Editor di Supabase.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl text-white">
                <UserCircle size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Control Panel</h2>
                <p className="text-slate-500 text-sm">Gestione utente e permessi di accesso.</p>
            </div>
          </div>
          
          {/* Tab Switcher */}
          {user.role === 'ADMIN' && (
             <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Il Mio Profilo
                 </button>
                 <button 
                    onClick={() => setActiveTab('visitors')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'visitors' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     <Users size={16} /> Gestione Utenti
                 </button>
             </div>
          )}
      </div>

      {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Info Card */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-500" />
                        Badge Utente
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-center py-4">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50 text-center">
                             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {user.role === 'ADMIN' ? 'AMMINISTRATORE' : 'VISITATORE'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div className="md:col-span-2">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        Modifica Dati
                    </h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                        {profileMessage && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                                profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {profileMessage.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                                {profileMessage.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Visualizzato</label>
                            <input 
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <Key size={14} /> Cambio Password (Opzionale)
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nuova Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Lascia vuoto se non vuoi cambiare password.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Conferma Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmittingProfile}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                            >
                                {isSubmittingProfile ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" />
                                        Salvataggio...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Salva Modifiche
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'visitors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Viewer Form */}
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-4">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Plus size={18} className="text-green-600" />
                          Nuovo Profilo Visitatore
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                          Crea un account accessibile da remoto. L'utente potrà accedere al software da qualsiasi postazione usando queste credenziali.
                      </p>
                      <form onSubmit={handleAddViewer} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Username)</label>
                              <input 
                                type="email" 
                                required
                                value={newViewerEmail}
                                onChange={e => setNewViewerEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-400"
                                placeholder="nome.cognome@mail.com"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                              <input 
                                type="text" 
                                required
                                value={newViewerName}
                                onChange={e => setNewViewerName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-400"
                                placeholder="Mario Rossi"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                  <Key size={12}/> Password Accesso
                              </label>
                              <input 
                                type="text" 
                                required
                                value={newViewerPassword}
                                onChange={e => setNewViewerPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-400 bg-slate-50 font-mono"
                                placeholder="Crea Password Sicura"
                              />
                          </div>
                          
                          {/* Permissions Selection */}
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Permessi: Menu Visibili</label>
                              <div className="space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50 max-h-48 overflow-y-auto">
                                  {VIEW_PERMISSIONS.map((perm) => (
                                      <label key={perm.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                                          <input 
                                            type="checkbox" 
                                            checked={newViewerPermissions.includes(perm.id)}
                                            onChange={() => handleTogglePermission(perm.id)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                          />
                                          <div className="flex items-center gap-2 text-sm text-slate-700">
                                              <perm.icon size={14} className="text-slate-400" />
                                              {perm.label}
                                          </div>
                                      </label>
                                  ))}
                              </div>
                          </div>

                          <button 
                            type="submit"
                            disabled={isAddingViewer}
                            className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition flex items-center justify-center shadow-lg shadow-green-100"
                          >
                              {isAddingViewer ? <Loader2 className="animate-spin" size={18}/> : 'Crea Account Cloud'}
                          </button>
                      </form>
                  </div>
              </div>

              {/* Viewers List */}
              <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                              <Globe size={16} className="text-blue-500"/>
                              Profili Cloud Attivi
                          </h3>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => setShowSqlHelp(!showSqlHelp)}
                                className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center transition"
                             >
                                <Database size={14} className="mr-1"/> Script DB
                             </button>
                             <span className="text-xs bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-slate-500 font-mono">
                                {viewers.length} Utenti
                             </span>
                          </div>
                      </div>
                      
                      {/* SQL HELP BOX */}
                      {showSqlHelp && (
                          <div className="bg-slate-900 p-4 m-4 rounded-xl border border-slate-700 relative">
                              <div className="flex justify-between items-center mb-2">
                                  <p className="text-green-400 font-mono text-xs">SQL Riparazione Tabella Utenti</p>
                                  <button onClick={copySql} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center">
                                      <Copy size={12} className="mr-1"/> Copia
                                  </button>
                              </div>
                              <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto p-2 bg-black/30 rounded border border-slate-700 whitespace-pre-wrap">
                                  {VISITOR_TABLE_SQL}
                              </pre>
                              <p className="text-[10px] text-slate-500 mt-2">
                                  Istruzioni: Copia questo codice, vai su Supabase &gt; SQL Editor, incollalo ed esegui. Questo aggiungerà le colonne mancanti.
                              </p>
                          </div>
                      )}
                      
                      {isLoadingViewers ? (
                          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32}/></div>
                      ) : viewers.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                              <Users size={48} className="mx-auto mb-2 opacity-20"/>
                              <p>Nessun profilo visitatore creato.</p>
                          </div>
                      ) : (
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                  <tr>
                                      <th className="p-4 font-semibold">Credenziali Utente</th>
                                      <th className="p-4 font-semibold">Accesso Menu</th>
                                      <th className="p-4 font-semibold text-right">Azioni</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {viewers.map(viewer => {
                                      let perms = [];
                                      try { perms = JSON.parse(viewer.permissions); } catch(e) {}
                                      return (
                                        <tr key={viewer.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-800">{viewer.name}</p>
                                                <p className="text-xs text-slate-500">{viewer.email}</p>
                                                {viewer.password ? (
                                                    <p className="text-[10px] text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-1 rounded border border-slate-200">
                                                        PW: {viewer.password}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-red-400 font-mono mt-1">
                                                        PW non salvata (Tabella obsoleta?)
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {perms.length === 0 ? (
                                                        <span className="text-xs italic text-slate-400">Nessun accesso</span>
                                                    ) : (
                                                        perms.map((p: string) => {
                                                            const label = VIEW_PERMISSIONS.find(vp => vp.id === p)?.label || p;
                                                            return (
                                                                <span key={p} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                                                    {label}
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteViewer(viewer.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Elimina Account"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};