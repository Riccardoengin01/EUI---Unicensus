import React, { useState, useMemo } from 'react';
import { Ticket, Campus, Bathroom, GenderType, TicketNote, UserRole } from '../types';
import { AlertCircle, CheckCircle2, Clock, MapPin, Filter, X, MessageSquare, Send, Archive } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  campuses?: Campus[];
  bathrooms?: Bathroom[];
  userRole: UserRole;
  onUpdateTicket?: (updatedTicket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, campuses = [], bathrooms = [], userRole, onUpdateTicket }) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Selection State for Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newNote, setNewNote] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // 1. Must be Active (not closed)
      if (ticket.status === 'Chiuso') return false;
      
      // 2. Must be Maintenance type (not WorkRequest)
      if (ticket.type && ticket.type !== 'Maintenance') return false;

      if (filterCampus !== 'all' && ticket.campusName !== filterCampus) return false;
      if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;

      if (filterType !== 'all') {
        const matchingBathroom = bathrooms.find(b => {
          const campus = campuses.find(c => c.id === b.campusId);
          return b.code === ticket.bathroomCode && campus?.name === ticket.campusName;
        });
        if (matchingBathroom) {
            if (matchingBathroom.gender !== filterType) return false;
        } else {
            return false; 
        }
      }

      return true;
    });
  }, [tickets, filterCampus, filterPriority, filterType, bathrooms, campuses]);

  // --- Handlers ---

  const handleAddNote = () => {
    if (!selectedTicket || !newNote.trim() || !onUpdateTicket) return;

    const note: TicketNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      text: newNote.trim(),
      author: userRole === 'ADMIN' ? 'Admin' : 'Staff'
    };

    const updatedTicket: Ticket = {
      ...selectedTicket,
      notes: [...(selectedTicket.notes || []), note]
    };

    onUpdateTicket(updatedTicket);
    setSelectedTicket(updatedTicket); // Update local view
    setNewNote('');
  };

  const handleCloseTicket = () => {
    if (!selectedTicket || !onUpdateTicket) return;
    
    if (confirm("Sei sicuro di voler chiudere questo ticket? Verrà spostato in archivio.")) {
      const updatedTicket: Ticket = {
        ...selectedTicket,
        status: 'Chiuso'
      };
      onUpdateTicket(updatedTicket);
      setSelectedTicket(null); // Close modal
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Ticket Manutenzione</h2>
           <p className="text-slate-500 text-sm">Interventi ordinari derivanti da ispezioni.</p>
        </div>
        
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm items-center">
            
            <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Sede</span>
                <select 
                    value={filterCampus}
                    onChange={e => setFilterCampus(e.target.value)}
                    className="bg-slate-50 border-none text-sm font-medium text-slate-700 rounded focus:ring-2 focus:ring-blue-100 py-1"
                >
                    <option value="all">Tutte</option>
                    {campuses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

             <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Tipo</span>
                <select 
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="bg-slate-50 border-none text-sm font-medium text-slate-700 rounded focus:ring-2 focus:ring-blue-100 py-1"
                >
                    <option value="all">Tutti</option>
                    {Object.values(GenderType).map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Priorità</span>
                <select 
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="bg-slate-50 border-none text-sm font-medium text-slate-700 rounded focus:ring-2 focus:ring-blue-100 py-1"
                >
                    <option value="all">Tutte</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Bassa">Bassa</option>
                </select>
            </div>
        </div>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div className="p-10 bg-white rounded-xl text-center text-slate-500 border border-slate-200 flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-medium">Nessun ticket di manutenzione attivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer hover:border-blue-300"
            >
               {/* Priority Stripe */}
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                 ticket.priority === 'Alta' ? 'bg-red-500' :
                 ticket.priority === 'Media' ? 'bg-orange-400' :
                 'bg-blue-400'
               }`}></div>

               <div className="pl-4">
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            ticket.priority === 'Alta' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'Media' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {ticket.priority}
                        </span>
                        <span className="text-xs text-slate-400">#{ticket.id.slice(0,6)}</span>
                   </div>
                   <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ticket.status === 'Aperto' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'In Lavorazione' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                   </span>
                 </div>

                 <h3 className="font-bold text-slate-800 text-base mb-1 truncate">{ticket.title}</h3>

                 <p className="text-slate-500 text-xs mb-3 line-clamp-2 min-h-[2.5em]">
                    {ticket.description}
                 </p>

                 <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
                    <div className="flex items-center">
                        <MapPin size={12} className="mr-1 text-slate-400" />
                        <span className="font-medium text-slate-700 truncate max-w-[100px]">{ticket.campusName}</span>
                        <span className="mx-1 text-slate-300">|</span>
                        {ticket.bathroomCode}
                    </div>
                    {ticket.notes && ticket.notes.length > 0 && (
                        <div className="flex items-center text-blue-500 font-medium">
                          <MessageSquare size={12} className="mr-1" />
                          {ticket.notes.length}
                        </div>
                    )}
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        selectedTicket.priority === 'Alta' ? 'bg-red-100 text-red-700' :
                        selectedTicket.priority === 'Media' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {selectedTicket.priority}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">#{selectedTicket.id}</span>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">{selectedTicket.title}</h2>
                 <div className="flex items-center text-sm text-slate-500 mt-1">
                    <MapPin size={14} className="mr-1" />
                    {selectedTicket.campusName} - Bagno {selectedTicket.bathroomCode}
                 </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
               <div className="mb-6">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Descrizione Problema</h4>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed">
                   {selectedTicket.description}
                 </div>
               </div>

               <div className="mb-6">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center">
                    <MessageSquare size={14} className="mr-2" />
                    Storico & Aggiornamenti
                 </h4>
                 
                 <div className="space-y-4">
                    {/* Previous Notes */}
                    {selectedTicket.notes?.map(note => (
                      <div key={note.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                            {note.author.charAt(0)}
                         </div>
                         <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none shadow-sm flex-1">
                            <p className="text-sm text-slate-800">{note.text}</p>
                            <p className="text-xs text-slate-400 mt-2 text-right">{new Date(note.date).toLocaleString()}</p>
                         </div>
                      </div>
                    ))}
                    
                    {(!selectedTicket.notes || selectedTicket.notes.length === 0) && (
                      <p className="text-sm text-slate-400 italic">Nessun aggiornamento registrato.</p>
                    )}
                 </div>
               </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="p-4 bg-white border-t border-slate-100">
               {/* Add Note Input */}
               <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Aggiungi una nota operativa o di controllo..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
               </div>

               {userRole === 'ADMIN' && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500">
                        Aperto il: {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                        onClick={handleCloseTicket}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition font-medium text-sm"
                    >
                        <Archive size={16} className="mr-2" />
                        Chiudi e Archivia Ticket
                    </button>
                  </div>
               )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};