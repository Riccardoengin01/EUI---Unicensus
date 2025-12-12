import React, { useMemo } from 'react';
import { Ticket, UserRole } from '../types';
import { Archive, CheckCircle2, MapPin, Calendar, Clock, Hammer, FileText, Trash2 } from 'lucide-react';

interface TicketArchiveProps {
  tickets: Ticket[];
  userRole?: UserRole;
  onDeleteTicket?: (id: string) => void;
}

export const TicketArchive: React.FC<TicketArchiveProps> = ({ tickets, userRole, onDeleteTicket }) => {
  const closedTickets = useMemo(() => {
    return tickets.filter(t => t.status === 'Chiuso').sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tickets]);

  const handleDelete = (id: string) => {
      if(confirm("Sei sicuro di voler eliminare definitivamente questo record dall'archivio?")) {
          onDeleteTicket?.(id);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3">
            <div className="bg-slate-200 p-2 rounded-lg text-slate-600">
                <Archive size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Archivio Ticket</h2>
                <p className="text-slate-500 text-sm">Storico di tutti gli interventi completati e chiusi.</p>
            </div>
       </div>

       {closedTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Archive size={48} className="mx-auto mb-3 opacity-50" />
              <p>L'archivio è vuoto. Nessun ticket è stato ancora chiuso.</p>
          </div>
       ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Stato</th>
                        <th className="p-4">Oggetto & Descrizione</th>
                        <th className="p-4">Luogo</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Note</th>
                        {userRole === 'ADMIN' && <th className="p-4 text-right">Azioni</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {closedTickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-slate-50 group">
                            <td className="p-4">
                                {ticket.type === 'WorkRequest' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                                        <Hammer size={12} className="mr-1" /> Extra
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                        <FileText size={12} className="mr-1" /> Manut.
                                    </span>
                                )}
                            </td>
                            <td className="p-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    <CheckCircle2 size={12} className="mr-1" />
                                    Chiuso
                                </span>
                            </td>
                            <td className="p-4 max-w-md">
                                <div className="font-bold text-slate-800">{ticket.title}</div>
                                <div className="text-slate-500 truncate">{ticket.description}</div>
                                {ticket.estimatedCost && (
                                    <div className="text-xs text-slate-400 mt-1">Costo Finale: €{ticket.estimatedCost}</div>
                                )}
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-700">{ticket.campusName}</span>
                                    <span className="text-xs text-slate-400">{ticket.bathroomCode || '-'}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-500 text-xs font-mono">
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar size={12} /> Apr: {new Date(ticket.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1 text-green-600">
                                    <Clock size={12} /> Chiuso
                                </div>
                            </td>
                            <td className="p-4 text-right text-slate-400">
                                {ticket.notes?.length || 0} aggiornamenti
                            </td>
                            {userRole === 'ADMIN' && (
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(ticket.id)}
                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                        title="Elimina Definitivamente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
       )}
    </div>
  );
};