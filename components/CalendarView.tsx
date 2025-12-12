import React, { useState, useMemo } from 'react';
import { Ticket, Inspection, Bathroom, Campus, UserRole } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Circle, CheckCircle2, Trash2 } from 'lucide-react';

interface CalendarViewProps {
  tickets: Ticket[];
  inspections: Inspection[];
  bathrooms: Bathroom[];
  campuses: Campus[];
  userRole?: UserRole;
  onDeleteTicket?: (id: string) => void;
  onDeleteInspection?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    tickets, 
    inspections, 
    bathrooms, 
    campuses, 
    userRole, 
    onDeleteTicket, 
    onDeleteInspection 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const startDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday. We want Monday as 0 index visually for European calendars usually,
    // but JS getDay() returns 0 for Sunday.
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday is 0
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, { tickets: Ticket[], inspections: Inspection[] }> = {};

    const addToMap = (dateStr: string, type: 'ticket' | 'inspection', item: any) => {
       const key = new Date(dateStr).toDateString();
       if (!map[key]) map[key] = { tickets: [], inspections: [] };
       if (type === 'ticket') map[key].tickets.push(item);
       else map[key].inspections.push(item);
    };

    tickets.forEach(t => addToMap(t.createdAt, 'ticket', t));
    inspections.forEach(i => addToMap(i.date, 'inspection', i));

    return map;
  }, [tickets, inspections]);

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = startDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100"></div>);
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = date.toDateString();
      const events = eventsByDate[dateKey];
      const isSelected = selectedDate?.toDateString() === dateKey;
      const isToday = new Date().toDateString() === dateKey;

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-slate-100 p-2 relative cursor-pointer transition-colors hover:bg-blue-50
            ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : 'bg-white'}
          `}
        >
          <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center 
              ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
            {day}
          </span>
          
          <div className="mt-2 flex flex-wrap gap-1 content-start">
             {events?.tickets.map(t => (
                 <div key={t.id} className={`w-2 h-2 rounded-full ${t.type === 'WorkRequest' ? 'bg-purple-500' : 'bg-orange-500'}`} title={t.title}></div>
             ))}
             {events?.inspections.map(i => (
                 <div key={i.id} className="w-2 h-2 rounded-full bg-blue-400" title="Ispezione"></div>
             ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate.toDateString()] : null;

  const confirmDeleteTicket = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Sei sicuro di voler eliminare questo ticket dal calendario?")) {
          onDeleteTicket?.(id);
      }
  };

  const confirmDeleteInspection = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Sei sicuro di voler eliminare questa ispezione?")) {
          onDeleteInspection?.(id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <CalendarIcon className="text-blue-600" />
             Calendario Attività
           </h2>
           <p className="text-slate-500 text-sm">Pianificazione ispezioni e storico interventi.</p>
        </div>
        
        <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
            <span className="w-40 text-center font-bold text-slate-800">
                {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {/* Days Header */}
         <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
         </div>
         {/* Calendar Grid */}
         <div className="grid grid-cols-7">
            {renderCalendar()}
         </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                 Eventi del {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
             </h3>
             
             {(!selectedEvents || (selectedEvents.tickets.length === 0 && selectedEvents.inspections.length === 0)) ? (
                 <p className="text-slate-400 italic">Nessuna attività registrata per questa data.</p>
             ) : (
                 <div className="space-y-3">
                     {selectedEvents.tickets.map(t => (
                         <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                             <div className="flex items-center gap-3">
                                 <div className={`w-3 h-3 rounded-full ${t.type === 'WorkRequest' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                                 <div>
                                     <p className="font-bold text-sm text-slate-800">{t.title}</p>
                                     <p className="text-xs text-slate-500">{t.campusName} - {t.type === 'WorkRequest' ? 'Extra' : 'Manutenzione'}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">{t.status}</span>
                                {userRole === 'ADMIN' && (
                                    <button 
                                        onClick={(e) => confirmDeleteTicket(t.id, e)}
                                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                                        title="Elimina"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                             </div>
                         </div>
                     ))}
                     {selectedEvents.inspections.map(i => {
                         const bathroom = bathrooms.find(b => b.id === i.bathroomId);
                         const campus = campuses.find(c => c.id === bathroom?.campusId);
                         const label = bathroom ? `${campus?.name || 'Sede sconosciuta'} - ${bathroom.code}` : 'Bagno Eliminato';

                         return (
                             <div key={i.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 group">
                                 <div className="flex items-center gap-3">
                                     <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                     <div>
                                         <p className="font-bold text-sm text-slate-800">Ispezione: {label}</p>
                                         <p className="text-xs text-slate-500">
                                            {bathroom ? `Piano ${bathroom.floor} (${bathroom.gender})` : 'Dati non disponibili'}
                                         </p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3 text-blue-600">
                                     <div className="flex items-center gap-1">
                                        <CheckCircle2 size={14} />
                                        <span className="text-xs font-bold">Completata</span>
                                     </div>
                                     {userRole === 'ADMIN' && (
                                        <button 
                                            onClick={(e) => confirmDeleteInspection(i.id, e)}
                                            className="p-1.5 text-blue-300 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                                            title="Elimina"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
         </div>
      )}
    </div>
  );
};