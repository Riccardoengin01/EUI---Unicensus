import React, { useState, useMemo } from 'react';
import { Ticket, Campus, TicketNote, UserRole, Bathroom } from '../types';
import { Hammer, Plus, X, MapPin, Calendar, MessageSquare, Send, Archive, CheckCircle2, Euro, Coins, ChevronDown } from 'lucide-react';

interface WorkRequestManagerProps {
  tickets: Ticket[];
  campuses: Campus[];
  bathrooms: Bathroom[];
  userRole: UserRole;
  onCreateTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
}

export const WorkRequestManager: React.FC<WorkRequestManagerProps> = ({ tickets, campuses, bathrooms, userRole, onCreateTicket, onUpdateTicket }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Request Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCampus, setNewCampus] = useState(campuses[0]?.name || '');
  const [newBathroomCode, setNewBathroomCode] = useState<string>(''); // For Specific Bathroom selection
  const [newPriority, setNewPriority] = useState<'Bassa' | 'Media' | 'Alta'>('Media');
  const [newCost, setNewCost] = useState<string>('');

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newNote, setNewNote] = useState('');

  // Filter only Work Requests
  const workRequests = tickets.filter(t => t.type === 'WorkRequest' && t.status !== 'Chiuso');

  // Filter bathrooms based on selected campus name in the form
  const availableBathrooms = useMemo(() => {
     const selectedCampusId = campuses.find(c => c.name === newCampus)?.id;
     if (!selectedCampusId) return [];
     return bathrooms.filter(b => b.campusId === selectedCampusId).sort((a,b) => a.code.localeCompare(b.code));
  }, [newCampus, campuses, bathrooms]);

  const handleCreateSubmit = () => {
    if (!newTitle || !newDesc || !newCampus) return;

    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      type: 'WorkRequest',
      campusName: newCampus,
      bathroomCode: newBathroomCode || undefined, // Include bathroom code if selected
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      estimatedCost: newCost ? parseFloat(newCost) : undefined,
      createdAt: new Date().toISOString(),
      status: 'Aperto',
      notes: []
    };

    onCreateTicket(newTicket);
    setIsModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Media');
    setNewCost('');
    setNewBathroomCode('');
  };

  const handleAddNote = () => {
    if (!selectedTicket || !newNote.trim()) return;

    const note: TicketNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      text: newNote.trim(),
      author: userRole === 'ADMIN' ? 'Admin' : 'Staff'
    };

    const updatedTicket = {
      ...selectedTicket,
      notes: [...(selectedTicket.notes || []), note]
    };

    onUpdateTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    setNewNote('');
  };

  const handleCloseTicket = () => {
     if (!selectedTicket) return;
     if (confirm("Confermi il completamento di questo lavoro straordinario?")) {
        onUpdateTicket({ ...selectedTicket, status: 'Chiuso' });
        setSelectedTicket(null);
     }
  };

  const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setNewCampus(e.target.value);
      setNewBathroomCode(''); // Reset bathroom when campus changes
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Hammer className="text-purple-600" />
             Work Requests
           </h2>
           <p className="text-slate-500 text-sm">Gestione interventi straordinari, budget e nuove installazioni.</p>
        </div>
        
        {userRole === 'ADMIN' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center transition-transform hover:-translate-y-0.5"
            >
              <Plus size={18} className="mr-2" />
              Nuova Richiesta
            </button>
        )}
      </div>

      {/* List of Work Requests - GRID LAYOUT MATCHING TICKETLIST */}
      {workRequests.length === 0 ? (
           <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400">
              <Hammer size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nessuna richiesta di lavoro straordinario attiva.</p>
           </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {workRequests.map(ticket => (
             <div 
               key={ticket.id}
               onClick={() => setSelectedTicket(ticket)}
               className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md cursor-pointer group transition-all relative overflow-hidden"
             >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    ticket.priority === 'Alta' ? 'bg-red-500' : ticket.priority === 'Media' ? 'bg-orange-400' : 'bg-blue-400'
                }`}></div>
                
                <div className="pl-4">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-purple-100">Extra</span>
                         <span className="text-xs text-slate-400">#{ticket.id.slice(0,6)}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ticket.status === 'Aperto' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                          {ticket.status}
                      </span>
                   </div>
                   
                   <h3 className="font-bold text-slate-800 text-base mb-1 truncate group-hover:text-purple-600 transition-colors">{ticket.title}</h3>
                   
                   <p className="text-slate-500 text-xs mb-3 line-clamp-2 min-h-[2.5em]">{ticket.description}</p>
                   
                   <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                         <MapPin size={12} className="text-slate-400" /> 
                         <span className="truncate max-w-[100px] font-medium">{ticket.campusName}</span>
                         {ticket.bathroomCode && (
                             <span className="text-slate-400 ml-1">/ {ticket.bathroomCode}</span>
                         )}
                      </div>
                      
                      {ticket.estimatedCost && (
                          <div className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                             <Euro size={10} /> {ticket.estimatedCost.toLocaleString()}
                          </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* CREATE NEW REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-purple-50">
               <h3 className="font-bold text-purple-900 flex items-center gap-2">
                 <Plus size={20} /> Nuova Work Request
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-purple-400 hover:text-purple-700">
                 <X size={24} />
               </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titolo Intervento</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Es. Installazione nuovi proiettori..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sede</label>
                    <div className="relative">
                        <select 
                            value={newCampus}
                            onChange={handleCampusChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none appearance-none"
                        >
                            {campuses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                         <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={14}/>
                        </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Locale / Bagno</label>
                     <div className="relative">
                        <select 
                            value={newBathroomCode}
                            onChange={e => setNewBathroomCode(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none appearance-none"
                            disabled={availableBathrooms.length === 0}
                        >
                            <option value="">Nessuno / Intera Sede</option>
                            {availableBathrooms.map(b => (
                                <option key={b.id} value={b.code}>{b.code} (P. {b.floor})</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={14}/>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priorità</label>
                    <select 
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                    >
                        <option value="Bassa">Bassa</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                    </select>
                  </div>
                  {/* Cost Field */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Stimato (€)</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-500">€</span>
                          </div>
                          <input 
                            type="number" 
                            value={newCost}
                            onChange={e => setNewCost(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-slate-300 rounded-lg p-2.5 pl-8 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                          />
                      </div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrizione Lavori</label>
                  <textarea 
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Dettagli tecnici e operativi..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-200 outline-none h-24 resize-none"
                  />
               </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-lg">Annulla</button>
               <button onClick={handleCreateSubmit} className="px-6 py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700 shadow-md">Crea Richiesta</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-purple-50">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">Work Request</span>
                    {selectedTicket.estimatedCost && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            Budget: €{selectedTicket.estimatedCost.toLocaleString()}
                        </span>
                    )}
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">{selectedTicket.title}</h2>
                 <div className="flex items-center text-sm text-slate-500 mt-1">
                    <MapPin size={14} className="mr-1" /> {selectedTicket.campusName}
                    {selectedTicket.bathroomCode && <span className="ml-1 font-medium text-slate-600">- Locale: {selectedTicket.bathroomCode}</span>}
                 </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Specifica Lavori</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedTicket.description}</p>
               </div>
               
               {/* Notes Section */}
               <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center">
                   <MessageSquare size={14} className="mr-2" /> Avanzamento Lavori
               </h4>
               <div className="space-y-3 mb-6">
                   {selectedTicket.notes?.map(note => (
                       <div key={note.id} className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                           <p className="text-sm text-slate-800">{note.text}</p>
                           <p className="text-[10px] text-slate-400 mt-1 text-right">{new Date(note.date).toLocaleString()}</p>
                       </div>
                   ))}
               </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
               <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Aggiornamento avanzamento..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-purple-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button onClick={handleAddNote} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"><Send size={20} /></button>
               </div>
               {userRole === 'ADMIN' && (
                  <button onClick={handleCloseTicket} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 flex items-center justify-center">
                      <Archive size={16} className="mr-2" /> Chiudi e Archivia Richiesta
                  </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};