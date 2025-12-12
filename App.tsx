import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Campus, Bathroom, Ticket, Inspection, GenderType, InspectionStatus, User } from './types';
import { Dashboard } from './components/Dashboard';
import { CampusManager } from './components/CampusManager';
import { InspectionView } from './components/InspectionView';
import { TicketList } from './components/TicketList';
import { WorkRequestManager } from './components/WorkRequestManager';
import { ActivityLog } from './components/ActivityLog';
import { TicketArchive } from './components/TicketArchive';
import { CalendarView } from './components/CalendarView';
import { LoginScreen } from './components/LoginScreen';
import { ControlPanel } from './components/ControlPanel'; 
import { LayoutDashboard, CheckSquare, ClipboardList, Menu, X, FileText, Droplets, Archive, Hammer, Calendar, LogOut, UserCircle, Loader2, WifiOff, Database, Terminal, Settings } from 'lucide-react';
import { api } from './services/api'; 

enum View {
  DASHBOARD = 'dashboard',
  CENSUS = 'census',
  TICKETS = 'tickets',
  WORK_REQUESTS = 'work_requests',
  CALENDAR = 'calendar',
  TICKETS_ARCHIVE = 'tickets_archive',
  INSPECTION_FORM = 'inspection_form',
  ACTIVITY_LOG = 'activity_log',
  PROFILE = 'profile'
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Data State 
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Selection State for Inspection
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  // Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // SQL Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // AUTH CHECK ON MOUNT
  useEffect(() => {
    const checkSession = async () => {
        setIsAuthLoading(true);
        const user = await api.getCurrentSession();
        if (user) {
            setCurrentUser(user);
        }
        setIsAuthLoading(false);
    };
    checkSession();
  }, []);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const fetchData = async () => {
        if (!currentUser) return; 
        
        setIsLoading(true);
        setError(null);
        try {
            const [cData, bData, tData, iData] = await Promise.all([
                api.getCampuses(),
                api.getBathrooms(),
                api.getTickets(),
                api.getInspections()
            ]);

            setCampuses(cData);
            setBathrooms(bData);
            setTickets(tData);
            setInspections(iData);
        } catch (err: any) {
            console.error("Errore caricamento dati:", err);
            const msg = err.message || JSON.stringify(err);
            setError(`Errore Database: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [currentUser]); 

  const handleLogout = async () => {
      await api.logout();
      setCurrentUser(null);
      setCampuses([]);
      setBathrooms([]);
      setTickets([]);
      setInspections([]);
  };

  // ... Handlers ...
  const handleStartInspection = (bathroom: Bathroom, campus: Campus) => {
    setSelectedBathroom(bathroom);
    setSelectedCampus(campus);
    setCurrentView(View.INSPECTION_FORM);
  };

  const handleSaveInspection = async (inspection: Inspection, ticketDraft?: Partial<Ticket>) => {
    setInspections(prev => [inspection, ...prev]);
    try {
        await api.createInspection(inspection);
        if (ticketDraft && selectedBathroom && selectedCampus) {
            const newTicket: Ticket = {
                id: crypto.randomUUID(),
                type: 'Maintenance',
                inspectionId: inspection.id,
                bathroomCode: selectedBathroom.code,
                campusName: selectedCampus.name,
                title: ticketDraft.title || 'Manutenzione Generica',
                description: ticketDraft.description || '',
                priority: ticketDraft.priority || 'Media',
                createdAt: new Date().toISOString(),
                status: 'Aperto',
                notes: []
            };
            await api.createTicket(newTicket);
            await api.updateInspection(inspection.id, { ticketCreated: true, ticketId: newTicket.id });
            setTickets(prev => [newTicket, ...prev]);
            setInspections(prev => prev.map(i => i.id === inspection.id ? { ...i, ticketCreated: true, ticketId: newTicket.id } : i));
        }
    } catch (err) { alert("Errore salvataggio dati."); }
    setCurrentView(View.CENSUS);
    setSelectedBathroom(null);
  };

  const handleUpdateTicket = async (t: Ticket) => {
    setTickets(prev => prev.map(old => old.id === t.id ? t : old));
    try { await api.updateTicket(t); } catch(e) { console.error(e); }
  };
  const handleCreateTicket = async (t: Ticket) => {
     setTickets(prev => [t, ...prev]);
     try { await api.createTicket(t); } catch(e) { console.error(e); }
  };
  const handleDeleteTicket = async (id: string) => {
     setTickets(prev => prev.filter(t => t.id !== id));
     try { await api.deleteTicket(id); } catch(e) { console.error(e); alert("Errore eliminazione ticket"); }
  };
  const handleDeleteInspection = async (id: string) => {
      setInspections(prev => prev.filter(i => i.id !== id));
      try { await api.deleteInspection(id); } catch(e) { console.error(e); alert("Errore eliminazione ispezione"); }
  };

  const handleAddBathroom = async (b: Bathroom) => { setBathrooms(p => [...p, b]); await api.addBathroom(b); };
  const handleUpdateBathroom = async (b: Bathroom) => { setBathrooms(p => p.map(x => x.id === b.id ? b : x)); await api.updateBathroom(b); };
  const handleDeleteBathroom = async (id: string) => { setBathrooms(p => p.filter(x => x.id !== id)); await api.deleteBathroom(id); };
  const handleAddCampus = async (name: string) => { const c = { id: crypto.randomUUID(), name, parentId: null }; setCampuses(p => [...p, c]); await api.addCampus(c); };
  const handleEditCampus = async (id: string, name: string) => { setCampuses(p => p.map(c => c.id === id ? { ...c, name } : c)); await api.updateCampus(id, { name }); };
  const handleMoveCampus = async (id: string, pid: string|null) => { setCampuses(p => p.map(c => c.id === id ? { ...c, parentId: pid } : c)); await api.updateCampus(id, { parentId: pid }); };
  const handleDeleteCampus = async (id: string) => { setCampuses(p => p.filter(c => c.id !== id)); setBathrooms(p => p.filter(b => b.campusId !== id)); await api.deleteCampus(id); };
  const handleReorderCampuses = async (newC: Campus[]) => { setCampuses(newC); await api.reorderCampuses(newC); };
  const handleBulkImport = async (newC: Campus[], newB: Bathroom[]) => { setCampuses(p => [...p, ...newC]); setBathrooms(p => [...p, ...newB]); await api.bulkAddBathrooms(newC, newB); };

  // Helper per controllare i permessi di visualizzazione
  const canView = (view: View): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN') return true;
      if (!currentUser.permissions || currentUser.permissions.length === 0) return true; // Default fallback to all if empty
      return currentUser.permissions.includes(view);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => {
    if (!canView(view)) return null;
    return (
        <button
          onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full text-left ${
            currentView === view 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Icon size={20} />
          <span className="font-medium tracking-wide">{label}</span>
        </button>
    );
  };

  // SQL Code including ALTER statements to fix missing columns
  const sqlCode = `
-- 1. AGGIUNGE SUPPORTO ORDINAMENTO
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS order_index numeric DEFAULT 0;

-- 2. TABELLA VISITATORI AUTORIZZATI (Con Password e Permessi)
create table if not exists authorized_viewers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  password text, -- In produzione usare hash
  permissions text, -- JSON array
  created_at timestamptz default now()
);

-- 2.1 AGGIORNAMENTO PER VERSIONI PRECEDENTI (Importante)
alter table authorized_viewers add column if not exists password text;
alter table authorized_viewers add column if not exists permissions text;

-- 3. CREAZIONE ALTRE TABELLE
create table if not exists campuses (
  id uuid primary key,
  name text not null,
  parent_id uuid,
  order_index numeric default 0
);

create table if not exists bathrooms (
  id uuid primary key,
  campus_id uuid references campuses(id),
  floor text,
  code text,
  gender text,
  notes text
);

create table if not exists tickets (
  id uuid primary key,
  type text,
  inspection_id uuid,
  bathroom_code text,
  campus_name text,
  title text,
  description text,
  priority text,
  estimated_cost numeric,
  status text,
  created_at timestamptz,
  notes jsonb
);

create table if not exists inspections (
  id uuid primary key,
  bathroom_id uuid,
  date timestamptz,
  records jsonb,
  ticket_created boolean,
  ticket_id uuid
);

-- 4. PERMESSI (Accesso Libero per Demo)
alter table campuses disable row level security;
alter table bathrooms disable row level security;
alter table tickets disable row level security;
alter table inspections disable row level security;
alter table authorized_viewers disable row level security;
  `;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    alert("SQL Copiato! Incollalo nell'SQL Editor di Supabase.");
  };

  if (isAuthLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 size={40} className="animate-spin text-blue-600"/>
          </div>
      );
  }

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  // Errore Bloccante
  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 p-4">
             <div className="bg-white p-8 rounded-2xl border border-red-100 text-center max-w-lg shadow-xl">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <WifiOff size={32} />
                </div>
                <h3 className="text-red-600 font-bold text-xl mb-2">Errore di Connessione</h3>
                <p className="text-slate-600 mb-6 font-mono text-sm bg-slate-50 p-3 rounded border border-slate-200 break-words">
                    {error}
                </p>
                <div className="space-y-3">
                    <button onClick={() => window.location.reload()} className="w-full bg-red-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition">
                        Riprova Connessione
                    </button>
                    {/* Pulsante di emergenza per SQL */}
                    <button onClick={() => { setError(null); setIsSqlModalOpen(true); }} className="w-full bg-slate-100 text-blue-700 px-4 py-3 rounded-xl font-bold hover:bg-blue-50 border border-slate-200 flex items-center justify-center transition">
                        <Database size={18} className="mr-2" />
                        Mostra SQL Configurazione
                    </button>
                </div>
             </div>
             {/* Modal SQL */}
             {isSqlModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold flex items-center gap-2"><Database size={18}/> Configurazione Database</h3>
                            <button onClick={() => setIsSqlModalOpen(false)}><X size={20}/></button>
                         </div>
                         <div className="p-4 overflow-y-auto bg-slate-900 text-green-400 font-mono text-xs flex-1">
                             <pre>{sqlCode}</pre>
                         </div>
                         <div className="p-4 border-t border-slate-100 bg-white">
                             <button onClick={copySqlToClipboard} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Copia Codice SQL</button>
                         </div>
                    </div>
                </div>
             )}
          </div>
      )
  }

  // App Normale
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* SQL MODAL GLOBALE - Solo se aperto da errore precedente, ma di base nascosto dal menu normale */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <Database size={20} className="text-blue-600"/> 
                            Setup Database
                        </h3>
                        <p className="text-xs text-slate-500">Script di emergenza per ripristino tabelle.</p>
                    </div>
                    <button onClick={() => setIsSqlModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-4">
                        <code className="block font-mono text-xs text-green-400 leading-relaxed whitespace-pre-wrap">
                            {sqlCode}
                        </code>
                    </div>
                    
                    <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                        <button onClick={() => setIsSqlModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Chiudi</button>
                        <button onClick={copySqlToClipboard} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center">
                            <ClipboardList size={18} className="mr-2" />
                            Copia SQL
                        </button>
                    </div>
            </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                    <Droplets size={24} />
                 </div>
                 <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">UniCensus<br/><span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Facility PRO</span></h1>
            </div>
            <button className="lg:hidden text-slate-500" onClick={() => setMobileMenuOpen(false)}>
              <X size={24}/>
            </button>
          </div>

          <nav className="flex-1 space-y-3">
            <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={View.CENSUS} icon={CheckSquare} label="Gestione Ville & Sedi" />
            <NavItem view={View.TICKETS} icon={ClipboardList} label="Ticket Manutenzione" />
            <NavItem view={View.WORK_REQUESTS} icon={Hammer} label="Work Requests" />
            <NavItem view={View.CALENDAR} icon={Calendar} label="Calendario" />
            <NavItem view={View.ACTIVITY_LOG} icon={FileText} label="Registro Attività" />
            
            <div className="pt-4 mt-4 border-t border-slate-100">
                <NavItem view={View.TICKETS_ARCHIVE} icon={Archive} label="Archivio Ticket" />
                <NavItem view={View.PROFILE} icon={Settings} label="Control Panel" />
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
             {/* REDESIGNED USER CARD */}
             <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                 
                 <div className="flex items-center gap-3 relative z-10 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-slate-800 shadow-md">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate leading-tight">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">
                            {currentUser.role === 'ADMIN' ? 'Amministratore' : 'Visitatore'}
                        </p>
                    </div>
                 </div>

                 <div className="flex gap-2 relative z-10">
                    <button 
                        onClick={() => setCurrentView(View.PROFILE)}
                        className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1"
                    >
                        <Settings size={12} /> Profilo
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition flex items-center justify-center gap-1"
                    >
                        <LogOut size={12} /> Esci
                    </button>
                 </div>
             </div>

            <div className="text-[10px] text-slate-300 space-y-1 text-center mt-4 font-medium opacity-60">
              <p>v1.8.0 - Granular Access</p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-30">
           <span className="font-bold text-blue-700 text-lg">UniCensus PRO</span>
           <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600">
             <Menu size={24} />
           </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 relative scroll-smooth">
           {currentView === View.DASHBOARD && canView(View.DASHBOARD) && (
             <Dashboard 
                campuses={campuses} 
                bathrooms={bathrooms} 
                tickets={tickets} 
                inspections={inspections} 
             />
           )}

           {currentView === View.CENSUS && canView(View.CENSUS) && (
             <CampusManager 
               campuses={campuses} 
               bathrooms={bathrooms} 
               inspections={inspections}
               userRole={currentUser.role}
               onSelectBathroom={handleStartInspection}
               onAddBathroom={handleAddBathroom}
               onUpdateBathroom={handleUpdateBathroom}
               onDeleteBathroom={handleDeleteBathroom}
               onAddCampus={handleAddCampus}
               onEditCampus={handleEditCampus}
               onMoveCampus={handleMoveCampus}
               onDeleteCampus={handleDeleteCampus}
               onReorderCampuses={handleReorderCampuses}
               onBulkImport={handleBulkImport}
             />
           )}

           {currentView === View.INSPECTION_FORM && selectedBathroom && selectedCampus && (
             <InspectionView
               bathroom={selectedBathroom}
               campus={selectedCampus}
               onBack={() => setCurrentView(View.CENSUS)}
               onSave={handleSaveInspection}
             />
           )}

           {currentView === View.TICKETS && canView(View.TICKETS) && (
             <TicketList 
                tickets={tickets} 
                campuses={campuses} 
                bathrooms={bathrooms}
                userRole={currentUser.role}
                onUpdateTicket={handleUpdateTicket}
             />
           )}

           {currentView === View.WORK_REQUESTS && canView(View.WORK_REQUESTS) && (
             <WorkRequestManager
               tickets={tickets}
               campuses={campuses}
               bathrooms={bathrooms} // Added prop
               userRole={currentUser.role}
               onCreateTicket={handleCreateTicket}
               onUpdateTicket={handleUpdateTicket}
             />
           )}
           
           {currentView === View.CALENDAR && canView(View.CALENDAR) && (
             <CalendarView
               tickets={tickets}
               inspections={inspections}
               bathrooms={bathrooms} // Added prop
               campuses={campuses}   // Added prop
               userRole={currentUser.role} // Added prop
               onDeleteTicket={handleDeleteTicket} // Added prop
               onDeleteInspection={handleDeleteInspection} // Added prop
             />
           )}

           {currentView === View.TICKETS_ARCHIVE && canView(View.TICKETS_ARCHIVE) && (
             <TicketArchive 
                tickets={tickets} 
                userRole={currentUser.role} // Added prop
                onDeleteTicket={handleDeleteTicket} // Added prop
             />
           )}
           
           {currentView === View.ACTIVITY_LOG && canView(View.ACTIVITY_LOG) && (
             <ActivityLog inspections={inspections} bathrooms={bathrooms} campuses={campuses} tickets={tickets} />
           )}

           {currentView === View.PROFILE && (
             <ControlPanel 
                user={currentUser} 
                onUpdateUser={setCurrentUser} 
             />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;