
import React, { useMemo } from 'react';
import { Inspection, Bathroom, Campus, Ticket } from '../types';
import { Clock, CheckCircle2, AlertTriangle, FileText, Search, Hammer, Download, Activity, ArrowRight } from 'lucide-react';

interface ActivityLogProps {
  inspections: Inspection[]; // Kept for prop compatibility but unused for active works
  bathrooms: Bathroom[];
  campuses: Campus[];
  tickets: Ticket[]; 
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ bathrooms, campuses, tickets }) => {
  
  // FILTER: Only Active Tickets (Maintenance + WorkRequests)
  const activeWorks = useMemo(() => {
    return tickets
        .filter(t => t.status !== 'Chiuso')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets]);

  const downloadReport = () => {
    // Generate CSV Content for Active Works
    const headers = ['Tipo', 'Priorità', 'Data Apertura', 'Sede', 'Locale', 'Titolo', 'Stato', 'ID'];
    
    const rows = activeWorks.map(t => {
        const typeLabel = t.type === 'WorkRequest' ? 'Extra (WR)' : 'Manutenzione';
        const locale = t.bathroomCode || '-';
        return [
            typeLabel,
            t.priority,
            new Date(t.createdAt).toLocaleDateString(),
            t.campusName,
            locale,
            t.title,
            t.status,
            t.id
        ].map(cell => `"${cell}"`).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lavorazioni_in_corso_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Activity className="text-blue-600" />
             Registro Lavorazioni in Corso
           </h2>
           <p className="text-slate-500 text-sm">Riepilogo globale di tutte le attività aperte (Manutenzione Ordinaria & Richieste Extra).</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={downloadReport}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center shadow-sm"
                title="Scarica Lista Lavorazioni"
            >
                <Download size={18} className="mr-2" /> Export Excel
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeWorks.length === 0 ? (
           <div className="p-10 text-center text-slate-400">
               <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500 opacity-50" />
               <p className="text-slate-600 font-bold">Nessuna lavorazione in corso!</p>
               <p className="text-sm">Tutte le attività sono state completate e archiviate.</p>
           </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                   <th className="p-4 font-semibold">Tipo</th>
                   <th className="p-4 font-semibold">Priorità</th>
                   <th className="p-4 font-semibold">Oggetto Lavorazione</th>
                   <th className="p-4 font-semibold">Sede / Locale</th>
                   <th className="p-4 font-semibold">Data Apertura</th>
                   <th className="p-4 font-semibold">Stato Attuale</th>
                   <th className="p-4 font-semibold text-right">Rif.</th>
                 </tr>
               </thead>
               <tbody className="text-sm divide-y divide-slate-100">
                 {activeWorks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        {/* TIPO */}
                        <td className="p-4">
                            {t.type === 'WorkRequest' ? (
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg" title="Richiesta Extra">
                                        <Hammer size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-700 hidden md:inline">Extra</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg" title="Manutenzione da Ispezione">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 hidden md:inline">Manut.</span>
                                </div>
                            )}
                        </td>

                        {/* PRIORITÀ */}
                        <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                t.priority === 'Alta' ? 'bg-red-50 text-red-700 border-red-100' :
                                t.priority === 'Media' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {t.priority}
                            </span>
                        </td>

                        {/* OGGETTO */}
                        <td className="p-4">
                            <p className="font-bold text-slate-800 truncate max-w-xs">{t.title}</p>
                            <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>
                        </td>

                        {/* SEDE */}
                        <td className="p-4 text-slate-600">
                            <p className="font-medium text-xs">{t.campusName}</p>
                            {t.bathroomCode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.bathroomCode}</p>}
                        </td>

                        {/* DATA */}
                        <td className="p-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString()}
                        </td>

                        {/* STATO */}
                        <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                t.status === 'In Lavorazione' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                            }`}>
                                {t.status === 'In Lavorazione' && <Clock size={12} className="mr-1" />}
                                {t.status}
                            </span>
                        </td>

                        {/* ID */}
                        <td className="p-4 text-right text-slate-400 font-mono text-xs">
                             #{t.id.slice(0, 6)}
                        </td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
};
