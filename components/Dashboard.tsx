import React, { useState, useMemo } from 'react';
import { Campus, Bathroom, Ticket, Inspection, GenderType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Building2, AlertTriangle, CheckCircle, ClipboardList, Filter, TrendingUp, ThumbsUp, Star, ShieldCheck, LayoutDashboard, Hammer } from 'lucide-react';

interface DashboardProps {
  campuses: Campus[];
  bathrooms: Bathroom[];
  tickets: Ticket[];
  inspections: Inspection[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ campuses, bathrooms, tickets, inspections }) => {
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');

  // --- Filtering Logic ---
  const filteredBathrooms = useMemo(() => {
    return selectedCampusId === 'all' 
      ? bathrooms 
      : bathrooms.filter(b => b.campusId === selectedCampusId);
  }, [bathrooms, selectedCampusId]);

  const filteredTickets = useMemo(() => {
    if (selectedCampusId === 'all') return tickets;
    const campusName = campuses.find(c => c.id === selectedCampusId)?.name;
    return tickets.filter(t => t.campusName === campusName);
  }, [tickets, campuses, selectedCampusId]);

  // --- Statistics ---
  // Active Issues (Status != Chiuso)
  const totalActiveIssues = filteredTickets.filter(t => t.status !== 'Chiuso').length;
  
  // Breakdown
  const maintenanceIssues = filteredTickets.filter(t => t.status !== 'Chiuso' && (!t.type || t.type === 'Maintenance')).length;
  const workRequestsActive = filteredTickets.filter(t => t.status !== 'Chiuso' && t.type === 'WorkRequest').length;

  const criticalIssues = filteredTickets.filter(t => t.priority === 'Alta' && t.status !== 'Chiuso').length;
  const closedTickets = filteredTickets.filter(t => t.status === 'Chiuso').length;
  
  // Breakdown by Gender
  const countMale = filteredBathrooms.filter(b => b.gender === GenderType.MALE).length;
  const countFemale = filteredBathrooms.filter(b => b.gender === GenderType.FEMALE).length;
  const countDisabled = filteredBathrooms.filter(b => b.gender === GenderType.DISABLED).length;
  const countAllGender = filteredBathrooms.filter(b => b.gender === GenderType.ALL_GENDER).length;

  // Logic for "Incentive" / Gamification
  const isPerformanceGood = criticalIssues === 0 && maintenanceIssues < 5;
  const performanceScore = Math.max(0, 100 - (criticalIssues * 20) - (maintenanceIssues * 5));

  const statusData = [
    { name: 'Aperti', value: filteredTickets.filter(t => t.status === 'Aperto').length },
    { name: 'In Lavorazione', value: filteredTickets.filter(t => t.status === 'In Lavorazione').length },
    { name: 'Chiusi', value: filteredTickets.filter(t => t.status === 'Chiuso').length },
  ];

  const censusData = useMemo(() => {
    if (selectedCampusId === 'all') {
        // Show TOP 10 Campuses with issues to avoid dense charts
        const data = campuses.map(c => {
            const total = bathrooms.filter(b => b.campusId === c.id).length;
            const withIssues = tickets.filter(t => t.campusName === c.name && t.status !== 'Chiuso').length;
            return {
                name: c.name,
                "Totale Strutture": total,
                "Con Anomalie": withIssues
            };
        });

        // Sort by Issues (desc) then Total (desc) and take top 10
        return data
            .sort((a, b) => b["Con Anomalie"] - a["Con Anomalie"] || b["Totale Strutture"] - a["Totale Strutture"])
            .slice(0, 10);

    } else {
        const c = campuses.find(x => x.id === selectedCampusId);
        if(!c) return [];
        const groups = ['Uomo', 'Donna', 'Disabile', 'All-Gender'];
        return groups.map(g => {
            const inGroup = filteredBathrooms.filter(b => b.gender === g);
            const codes = inGroup.map(b => b.code);
            const issues = filteredTickets.filter(t => codes.includes(t.bathroomCode || '') && t.status !== 'Chiuso').length;
            return {
                name: g,
                "Totale Strutture": inGroup.length,
                "Con Anomalie": issues
            };
        });
    }
  }, [campuses, bathrooms, tickets, selectedCampusId, filteredBathrooms, filteredTickets]);


  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. HERO INCENTIVE PANEL */}
      <div className={`p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${isPerformanceGood ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700' : 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800'}`}>
         
         {/* Background Patterns */}
         <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
             {isPerformanceGood ? <ShieldCheck size={400} /> : <Star size={400} />}
         </div>
         <div className="absolute left-0 bottom-0 opacity-10 transform -translate-x-10 translate-y-10">
             <Building2 size={300} />
         </div>

         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                     <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">Facility Status</span>
                     {isPerformanceGood && <span className="bg-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 border border-emerald-400/30">Excellent</span>}
                </div>
                <h3 className="text-4xl lg:text-5xl font-black mb-4 flex items-center justify-center lg:justify-start gap-4 tracking-tight drop-shadow-sm">
                    {isPerformanceGood ? "Tutto Operativo!" : "Manutenzione Richiesta"}
                </h3>
                <p className="text-blue-50 text-lg lg:text-xl max-w-2xl font-light leading-relaxed opacity-90">
                    {isPerformanceGood 
                        ? "Ottimo lavoro. Le sedi sono pulite e funzionali. I livelli di servizio sono al massimo." 
                        : "Ci sono interventi prioritari che richiedono attenzione per ripristinare lo standard qualitativo."}
                </p>
                
                <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <span className="text-xs uppercase tracking-wider block text-blue-200 mb-1">Indice Qualità</span>
                        <span className="text-3xl font-bold">{performanceScore}/100</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <span className="text-xs uppercase tracking-wider block text-blue-200 mb-1">Ticket Risolti</span>
                        <span className="text-3xl font-bold">{closedTickets}</span>
                    </div>
                </div>
            </div>
            
            {/* Visual Indicator Ring */}
            <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-black/10"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                        strokeDasharray={`${performanceScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-4xl font-black">{isPerformanceGood ? 'A+' : 'B'}</span>
                    <span className="text-xs opacity-75">RATING</span>
                </div>
            </div>
         </div>
      </div>

      {/* 2. FILTER & TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <LayoutDashboard size={20} className="text-blue-600"/>
                {selectedCampusId === 'all' ? 'Panoramica Generale' : `Dashboard: ${campuses.find(c => c.id === selectedCampusId)?.name}`}
            </h2>
            <p className="text-slate-500 text-sm pl-7">Analisi in tempo reale dello stato delle infrastrutture.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <div className="pl-3 text-slate-400"><Filter size={16} /></div>
            <select 
                value={selectedCampusId} 
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="bg-transparent border-none text-slate-700 text-sm font-semibold focus:ring-0 cursor-pointer py-1.5 pr-8"
            >
                <option value="all">Tutte le Sedi</option>
                {campuses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>
        </div>
      </div>
      
      {/* 3. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">
                    {selectedCampusId === 'all' ? 'Sedi Censite' : 'Sede Attiva'}
                </p>
                <p className="text-4xl font-bold text-slate-800">
                    {selectedCampusId === 'all' ? campuses.length : '1'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  <Building2 size={24} />
              </div>
          </div>
        </div>

        {/* MODIFICATO: Card Totale Bagni con dettaglio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Totale Bagni</p>
                <p className="text-4xl font-bold text-slate-800">{filteredBathrooms.length}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                  <ClipboardList size={24} />
              </div>
          </div>
          {/* Detailed Breakdown */}
          <div className="flex justify-between items-center text-xs mt-2 pt-3 border-t border-slate-100">
              <div className="flex flex-col items-center">
                  <span className="font-bold text-blue-600">{countMale}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Uomo</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="font-bold text-pink-600">{countFemale}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Donna</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="font-bold text-indigo-600">{countAllGender}</span>
                  <span className="text-[10px] text-slate-400 uppercase">All</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="font-bold text-purple-600">{countDisabled}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Disab.</span>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Lavorazioni Attive</p>
                <p className="text-4xl font-bold text-slate-800">{totalActiveIssues}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                  <AlertTriangle size={24} />
              </div>
          </div>
          <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-slate-100">
             <span className="flex items-center text-slate-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                {maintenanceIssues} Manutenzione
             </span>
             <span className="flex items-center text-slate-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></div>
                {workRequestsActive} Extra (WR)
             </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-red-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
             <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Criticità</p>
             <span className={`text-xs font-bold px-2 py-0.5 rounded ${criticalIssues > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {criticalIssues > 0 ? 'ATTENTION' : 'SAFE'}
             </span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{criticalIssues}</p>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
             <div className={`h-full transition-all duration-500 ${criticalIssues > 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(((criticalIssues + 1) / (totalActiveIssues + 1 || 1)) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            Stato Ticket (Totale)
          </h3>
          <div className="h-72">
             {statusData.every(d => d.value === 0) ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   <CheckCircle size={40} className="mb-2 text-slate-300"/>
                   Nessun ticket presente
               </div>
             ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            {selectedCampusId === 'all' ? 'Top 10 Sedi con Anomalie' : 'Anomalie per Tipologia'}
          </h3>
          <div className="h-72">
             {censusData.length === 0 || censusData.every(d => d["Totale Strutture"] === 0) ? (
                 <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nessun dato disponibile</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={censusData} layout="vertical" barGap={4} margin={{left: 20}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Totale Strutture" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} name="Totale" />
                    <Bar dataKey="Con Anomalie" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} name="Critici" />
                  </BarChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};