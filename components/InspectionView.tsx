import React, { useState } from 'react';
import { Bathroom, Campus, Inspection, InspectionRecord, INSPECTION_ITEMS, InspectionStatus, GenderType } from '../types';
import { Save, AlertTriangle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Loader2, Sparkles, Hammer, Ban, Info, Lock } from 'lucide-react';
import { generateTicketFromInspection } from '../services/geminiService';

interface InspectionViewProps {
  bathroom: Bathroom;
  campus: Campus;
  onBack: () => void;
  onSave: (inspection: Inspection, ticketData?: any) => void;
}

export const InspectionView: React.FC<InspectionViewProps> = ({ bathroom, campus, onBack, onSave }) => {
  const [records, setRecords] = useState<Record<string, InspectionRecord>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleStatusChange = (itemId: string, status: InspectionStatus) => {
    setRecords(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        status,
        note: prev[itemId]?.note || ''
      }
    }));
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [itemId]: {
        itemId: prev[itemId]?.itemId || itemId,
        status: prev[itemId]?.status || InspectionStatus.NOT_PRESENT,
        note
      }
    }));
  };

  // Filter items based on bathroom type
  const activeInspectionItems = INSPECTION_ITEMS.filter(item => {
    if (item.category === 'Accessibilità') {
      return bathroom.gender === GenderType.DISABLED;
    }
    return true;
  });

  const calculateProgress = () => {
    const filled = Object.keys(records).length;
    const total = activeInspectionItems.length;
    return Math.round((filled / total) * 100);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLoadingText('Analisi con Gemini AI...');

    const inspectionRecords = Object.values(records) as InspectionRecord[];

    const inspectionData: Inspection = {
      id: crypto.randomUUID(),
      bathroomId: bathroom.id,
      date: new Date().toISOString(),
      records: inspectionRecords,
      ticketCreated: false
    };

    const needsTicket = inspectionRecords.some(
      r => r.status === InspectionStatus.WARNING || r.status === InspectionStatus.CRITICAL
    );

    let generatedTicket = null;

    if (needsTicket) {
      try {
        const ticketDraft = await generateTicketFromInspection(inspectionData, bathroom.code, campus.name);
        generatedTicket = ticketDraft;
      } catch (e) {
        console.error("Failed to generate ticket", e);
      }
    }

    onSave(inspectionData, generatedTicket);
    setIsSubmitting(false);
  };

  const groups = {
    Strutturale: activeInspectionItems.filter(i => i.category === 'Strutturale'),
    Sanitari: activeInspectionItems.filter(i => i.category === 'Sanitari'),
    Riscaldamento: activeInspectionItems.filter(i => i.category === 'Riscaldamento'),
    ...(bathroom.gender === GenderType.DISABLED ? {
      Accessibilità: activeInspectionItems.filter(i => i.category === 'Accessibilità')
    } : {})
  };

  const statusOptions = [
    { status: InspectionStatus.OK, label: 'OK', icon: CheckCircle, colorClass: 'text-green-600', bgClass: 'bg-green-50', borderClass: 'border-green-200', activeClass: 'ring-2 ring-green-500 bg-green-100' },
    { status: InspectionStatus.WARNING, label: 'Attenzione', icon: AlertTriangle, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', borderClass: 'border-yellow-200', activeClass: 'ring-2 ring-yellow-500 bg-yellow-100' },
    { status: InspectionStatus.CRITICAL, label: 'Critico', icon: XCircle, colorClass: 'text-red-600', bgClass: 'bg-red-50', borderClass: 'border-red-200', activeClass: 'ring-2 ring-red-500 bg-red-100' },
    { status: InspectionStatus.NOT_PRESENT, label: 'N/A', icon: Ban, colorClass: 'text-slate-400', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', activeClass: 'ring-2 ring-slate-400 bg-slate-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2 sm:px-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
          <Sparkles size={150} />
        </div>
        
        <div className="relative z-10">
            <button onClick={onBack} className="flex items-center text-blue-100 hover:text-white mb-4 transition-colors">
            <ArrowRight className="mr-2 rotate-180" size={20} /> Torna all'elenco
            </button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1">{bathroom.code}</h1>
                    <div className="flex items-center space-x-3 text-blue-100">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">{campus.name}</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Piano {bathroom.floor}</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">{bathroom.gender}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-blue-200 mb-1">Avanzamento</div>
                    <div className="text-3xl font-bold">{calculateProgress()}%</div>
                </div>
            </div>
            
            {/* Notes / Permissions Alert */}
            {bathroom.notes && (
                <div className="mt-4 bg-yellow-400/20 backdrop-blur-md border border-yellow-200/50 rounded-xl p-3 flex items-start gap-3">
                    <Lock size={20} className="text-yellow-200 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-yellow-100 uppercase font-bold tracking-wider mb-1">Note Accesso / Permessi</p>
                        <p className="text-sm text-white font-medium">{bathroom.notes}</p>
                    </div>
                </div>
            )}
            
            {/* Custom Progress Bar inside Header */}
            <div className="mt-6 bg-black/20 rounded-full h-2 w-full overflow-hidden">
                <div 
                    className="bg-white h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${calculateProgress()}%` }}
                ></div>
            </div>
        </div>
      </div>

      {/* Form Groups */}
      <div className="space-y-8">
        {Object.entries(groups).map(([category, items]) => (
          items.length > 0 && (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between
                ${category === 'Accessibilità' ? 'bg-gradient-to-r from-purple-50 to-white' : 
                  category === 'Strutturale' ? 'bg-gradient-to-r from-slate-50 to-white' : 'bg-white'}`}>
                <h3 className={`font-bold text-xl flex items-center ${
                    category === 'Accessibilità' ? 'text-purple-700' : 
                    category === 'Strutturale' ? 'text-slate-700' : 
                    category === 'Sanitari' ? 'text-cyan-700' : 'text-orange-700'
                }`}>
                  {category}
                  {category === 'Accessibilità' && <span className="ml-3 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">Normativa</span>}
                </h3>
              </div>
              
              <div className="p-2 sm:p-6 space-y-2">
                {items.map(item => (
                  <div key={item.id} className="p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                        
                        {/* Label Section */}
                        <div className="lg:w-1/3">
                            <div className="flex items-center">
                                {item.isCleaning ? (
                                    <div className="p-2 bg-teal-50 text-teal-600 rounded-lg mr-3">
                                        <Sparkles size={18} />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg mr-3">
                                        <Hammer size={18} />
                                    </div>
                                )}
                                <div>
                                    <span className={`font-semibold text-lg ${item.isCleaning ? 'text-teal-900' : 'text-slate-700'}`}>
                                        {item.label}
                                    </span>
                                    {item.isCleaning && <p className="text-xs text-teal-500 font-medium">Verifica Pulizia</p>}
                                </div>
                            </div>
                        </div>
                    
                        {/* Controls Section */}
                        <div className="lg:w-2/3 flex flex-col gap-3">
                            {/* Buttons Grid */}
                            <div className="grid grid-cols-4 gap-2">
                                {statusOptions.map((opt) => {
                                    const isSelected = records[item.id]?.status === opt.status;
                                    return (
                                        <button
                                            key={opt.status}
                                            onClick={() => handleStatusChange(item.id, opt.status)}
                                            className={`
                                                flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 border
                                                ${isSelected ? opt.activeClass : `bg-white ${opt.borderClass} hover:bg-slate-50 text-slate-500`}
                                            `}
                                        >
                                            <opt.icon size={20} className={`mb-1 ${isSelected ? opt.colorClass : 'text-slate-400'}`} />
                                            <span className={`text-xs font-bold ${isSelected ? opt.colorClass : 'text-slate-400'}`}>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Note Input - Animated Expansion */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                (records[item.id]?.status === InspectionStatus.WARNING || records[item.id]?.status === InspectionStatus.CRITICAL) 
                                ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <textarea
                                    placeholder={item.isCleaning ? "Specificare dove è sporco..." : "Descrivi il danno o l'anomalia..."}
                                    value={records[item.id]?.note || ''}
                                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                    className="w-full p-3 text-sm bg-white border border-red-200 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none shadow-inner"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl z-50">
        <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`
                w-full bg-slate-900 text-white p-4 rounded-2xl font-bold text-lg shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:translate-y-0
                flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed
            `}
        >
            {isSubmitting ? (
                <>
                   <Loader2 className="animate-spin mr-3" />
                   {loadingText}
                </>
            ) : (
                <>
                    <Save className="mr-3" />
                    Completa e Salva Ispezione
                </>
            )}
        </button>
      </div>
    </div>
  );
};