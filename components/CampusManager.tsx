import React, { useState, useRef, useMemo } from 'react';
import { Campus, Bathroom, GenderType, Inspection, UserRole } from '../types';
import { MapPin, Plus, Edit2, X, Building, LayoutGrid, Upload, FileSpreadsheet, Trash2, FolderInput, CornerDownRight, ChevronRight, ChevronDown, Info, Lock, History, Search, Filter, Download, ArrowUp, ArrowDown } from 'lucide-react';

interface CampusManagerProps {
  campuses: Campus[];
  bathrooms: Bathroom[];
  inspections: Inspection[];
  userRole: UserRole;
  onSelectBathroom: (bathroom: Bathroom, campus: Campus) => void;
  onAddBathroom: (bathroom: Bathroom) => void;
  onUpdateBathroom: (bathroom: Bathroom) => void;
  onDeleteBathroom: (id: string) => void;
  onAddCampus: (name: string) => void;
  onEditCampus: (id: string, name: string) => void;
  onMoveCampus: (id: string, newParentId: string | null) => void; 
  onDeleteCampus: (id: string) => void;
  onReorderCampuses: (campuses: Campus[]) => void;
  onBulkImport: (campuses: Campus[], bathrooms: Bathroom[]) => void;
}

export const CampusManager: React.FC<CampusManagerProps> = ({ 
  campuses, 
  bathrooms, 
  inspections, 
  userRole,
  onSelectBathroom, 
  onAddBathroom,
  onUpdateBathroom,
  onDeleteBathroom,
  onAddCampus,
  onEditCampus,
  onMoveCampus,
  onDeleteCampus,
  onReorderCampuses,
  onBulkImport
}) => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(campuses[0]?.id || null);
  
  // Expanded Tree State (Main List)
  const [expandedCampusIds, setExpandedCampusIds] = useState<Set<string>>(new Set());
  
  // Expanded Tree State (Move Modal)
  const [expandedMoveIds, setExpandedMoveIds] = useState<Set<string>>(new Set());

  // Campus Editing State
  const [isAddingCampus, setIsAddingCampus] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [editingCampusName, setEditingCampusName] = useState('');
  
  // Moving Campus State
  const [movingCampus, setMovingCampus] = useState<Campus | null>(null);

  // Bathroom Adding/Editing State
  const [isAddingBathroom, setIsAddingBathroom] = useState(false);
  const [isEditingBathroom, setIsEditingBathroom] = useState(false);
  const [activeBathroom, setActiveBathroom] = useState<Partial<Bathroom>>({ gender: GenderType.MALE, floor: '0', notes: '' });

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived State
  const selectedCampus = campuses.find(c => c.id === selectedCampusId);
  const childCampuses = campuses.filter(c => c.parentId === selectedCampusId);
  
  const relevantCampusIds = [selectedCampusId, ...childCampuses.map(c => c.id)];
  
  // Filter Logic
  const filteredBathrooms = useMemo(() => {
    let filtered = bathrooms.filter(b => relevantCampusIds.includes(b.campusId));

    // 1. Search Filter
    if (searchTerm.trim()) {
        const lowerTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(b => b.code.toLowerCase().includes(lowerTerm));
    }

    // 2. Floor Filter
    if (selectedFloor !== 'all') {
        filtered = filtered.filter(b => b.floor === selectedFloor);
    }

    // Sort by Floor then Code
    return filtered.sort((a, b) => {
        if (a.floor === b.floor) return a.code.localeCompare(b.code);
        return a.floor.localeCompare(b.floor);
    });
  }, [bathrooms, relevantCampusIds, searchTerm, selectedFloor]);

  // Extract unique floors for the filter dropdown
  const availableFloors = useMemo(() => {
     const floors = new Set(bathrooms.filter(b => relevantCampusIds.includes(b.campusId)).map(b => b.floor));
     return Array.from(floors).sort();
  }, [bathrooms, relevantCampusIds]);

  // --- Helpers ---
  const getDescendants = (campusId: string): string[] => {
      const children = campuses.filter(c => c.parentId === campusId);
      let descendants = children.map(c => c.id);
      children.forEach(child => {
          descendants = [...descendants, ...getDescendants(child.id)];
      });
      return descendants;
  };

  const toggleExpand = (campusId: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setExpandedCampusIds(prev => {
        const next = new Set(prev);
        if (next.has(campusId)) next.delete(campusId);
        else next.add(campusId);
        return next;
    });
  };

  const toggleMoveExpand = (campusId: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setExpandedMoveIds(prev => {
        const next = new Set(prev);
        if (next.has(campusId)) next.delete(campusId);
        else next.add(campusId);
        return next;
    });
  };

  // --- Handlers ---

  const handleSaveNewCampus = () => {
    if (newCampusName.trim()) {
      onAddCampus(newCampusName.trim());
      setNewCampusName('');
      setIsAddingCampus(false);
    }
  };

  const handleStartEditCampus = (campus: Campus) => {
    if (userRole !== 'ADMIN') return;
    setEditingCampusId(campus.id);
    setEditingCampusName(campus.name);
  };

  const handleSaveEditCampus = () => {
    if (editingCampusId && editingCampusName.trim()) {
      onEditCampus(editingCampusId, editingCampusName.trim());
      setEditingCampusId(null);
      setEditingCampusName('');
    }
  };

  const handleMoveSubmit = (newParentId: string | null) => {
     if (movingCampus) {
         if (newParentId === movingCampus.id) return; 
         onMoveCampus(movingCampus.id, newParentId);
         setMovingCampus(null);
         setExpandedMoveIds(new Set()); // Reset move modal state
         if(newParentId) {
             setExpandedCampusIds(prev => new Set(prev).add(newParentId));
         }
     }
  };

  const handleDeleteCampusClick = (campus: Campus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole !== 'ADMIN') return;
    
    const linkedBathrooms = bathrooms.filter(b => b.campusId === campus.id).length;
    const subCampuses = campuses.filter(c => c.parentId === campus.id).length;
    
    let message = `Sei sicuro di voler eliminare definitivamente la sede "${campus.name}"?`;
    if (linkedBathrooms > 0 || subCampuses > 0) {
        message += `\n\nATTENZIONE: Questa sede contiene ${linkedBathrooms} bagni e ${subCampuses} sottosedi. Eliminando la sede verranno persi tutti i dati collegati.`;
    }

    if (confirm(message)) {
        onDeleteCampus(campus.id);
        if (selectedCampusId === campus.id) {
            setSelectedCampusId(null);
        }
    }
  };

  const handleMoveOrder = (campus: Campus, direction: 'up' | 'down', e: React.MouseEvent) => {
     e.stopPropagation();
     
     // 1. Identifica i fratelli (stesso parentId) mantenendo l'ordine attuale
     const siblings = campuses.filter(c => c.parentId === campus.parentId);
     
     // 2. Trova indice attuale tra i fratelli
     const currentIndex = siblings.findIndex(c => c.id === campus.id);
     if (currentIndex === -1) return;

     // 3. Determina indice target
     const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

     // 4. Controllo limiti
     if (targetIndex < 0 || targetIndex >= siblings.length) return;

     // 5. Identifica il vicino con cui scambiare
     const neighbour = siblings[targetIndex];

     // 6. Crea una copia della lista completa
     const newCampuses = [...campuses];

     // 7. Trova gli indici nella lista completa
     const indexA = newCampuses.findIndex(c => c.id === campus.id);
     const indexB = newCampuses.findIndex(c => c.id === neighbour.id);

     // 8. Esegui lo scambio nella lista completa
     if (indexA !== -1 && indexB !== -1) {
         newCampuses[indexA] = neighbour;
         newCampuses[indexB] = campus;
         
         // 9. Invia aggiornamento
         onReorderCampuses(newCampuses);
     }
  };


  const handleAddBathroomSubmit = () => {
    if (selectedCampusId && activeBathroom.code && activeBathroom.floor && activeBathroom.gender) {
      onAddBathroom({
        id: crypto.randomUUID(),
        campusId: selectedCampusId,
        code: activeBathroom.code,
        floor: activeBathroom.floor,
        gender: activeBathroom.gender,
        notes: activeBathroom.notes
      });
      setIsAddingBathroom(false);
      setActiveBathroom({ gender: GenderType.MALE, floor: '0', code: '', notes: '' });
    }
  };

  const handleEditBathroomClick = (bathroom: Bathroom, e: React.MouseEvent) => {
      e.stopPropagation(); 
      setActiveBathroom({ ...bathroom }); 
      setIsEditingBathroom(true);
  };

  const handleEditBathroomSubmit = () => {
      if (activeBathroom.id && activeBathroom.code && activeBathroom.floor && activeBathroom.gender && activeBathroom.campusId) {
          onUpdateBathroom({
              id: activeBathroom.id,
              campusId: activeBathroom.campusId, 
              code: activeBathroom.code,
              floor: activeBathroom.floor,
              gender: activeBathroom.gender,
              notes: activeBathroom.notes
          } as Bathroom);
          setIsEditingBathroom(false);
          setActiveBathroom({ gender: GenderType.MALE, floor: '0', code: '', notes: '' });
      }
  };

  const handleDeleteBathroomClick = () => {
    if(!activeBathroom.id) return;
    if(confirm("Sei sicuro di voler eliminare questo bagno? Verranno persi tutti i dati delle ispezioni collegate.")) {
        onDeleteBathroom(activeBathroom.id);
        setIsEditingBathroom(false);
        setActiveBathroom({ gender: GenderType.MALE, floor: '0', code: '', notes: '' });
    }
  };

  const getLastInspection = (bathroomId: string) => {
    const relevant = inspections.filter(i => i.bathroomId === bathroomId);
    if (relevant.length === 0) return null;
    return relevant.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  // --- EXPORT CSV ---
  const handleExportCensus = () => {
    if (!selectedCampus) return;
    
    // Header
    const headers = ['Sede', 'Sede Madre', 'Piano', 'Codice Bagno', 'Tipologia', 'Note'];
    
    // Rows
    const rows = filteredBathrooms.map(b => {
        const campus = campuses.find(c => c.id === b.campusId);
        const parent = campus?.parentId ? campuses.find(p => p.id === campus.parentId)?.name : '-';
        return [
            `"${campus?.name || ''}"`,
            `"${parent}"`,
            `"${b.floor}"`,
            `"${b.code}"`,
            `"${b.gender}"`,
            `"${b.notes || ''}"`
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `censimento_${selectedCampus.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV Import ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSV(text);
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText: string) => {
     const lines = csvText.split(/\r?\n/);
     const newCampuses: Campus[] = [];
     const newBathrooms: Bathroom[] = [];
     const campusMap = new Map<string, string>(); 
     campuses.forEach(c => campusMap.set(c.name.toLowerCase(), c.id));

     lines.forEach((line, index) => {
        if (!line.trim() || index === 0 && line.toLowerCase().includes('sede')) return;
        const cols = line.split(/[;,]/).map(c => c.trim());
        if (cols.length < 3) return;

        const [sedeName, piano, codice, genderRaw, noteRaw] = cols;
        let campusId = campusMap.get(sedeName.toLowerCase());
        if (!campusId) {
            const newC: Campus = { id: crypto.randomUUID(), name: sedeName, parentId: null };
            newCampuses.push(newC);
            campusId = newC.id;
            campusMap.set(sedeName.toLowerCase(), newC.id);
        }
        let gender = GenderType.ALL_GENDER;
        const g = genderRaw?.toLowerCase() || '';
        if (g.includes('uom') || g.includes('male')) gender = GenderType.MALE;
        else if (g.includes('donn') || g.includes('fem')) gender = GenderType.FEMALE;
        else if (g.includes('disab') || g.includes('hand')) gender = GenderType.DISABLED;

        const newB: Bathroom = {
            id: crypto.randomUUID(),
            campusId: campusId,
            floor: piano,
            code: codice,
            gender: gender,
            notes: noteRaw || ''
        };
        newBathrooms.push(newB);
     });

     if (confirm(`Trovate ${newCampuses.length} nuove sedi e ${newBathrooms.length} bagni. Confermi l'importazione?`)) {
        onBulkImport(newCampuses, newBathrooms);
        setIsImportModalOpen(false);
     }
  };

  // --- RENDERERS ---

  // Main Sidebar Item
  const renderCampusItem = (campus: Campus, depth: number = 0) => {
    const isEditing = editingCampusId === campus.id;
    const isSelected = selectedCampusId === campus.id;
    const children = campuses.filter(c => c.parentId === campus.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCampusIds.has(campus.id);
    
    // Determine siblings and position for move buttons
    const siblings = campuses.filter(c => c.parentId === campus.parentId);
    const index = siblings.findIndex(c => c.id === campus.id);
    const isFirst = index === 0;
    const isLast = index === siblings.length - 1;

    return (
        <React.Fragment key={campus.id}>
        <li className={`group relative mb-1`}>
            {isEditing ? (
                  <div className="p-3 bg-white rounded-xl border border-yellow-200 shadow-sm flex flex-col gap-2 mx-2">
                     <input 
                        type="text" 
                        value={editingCampusName}
                        onChange={e => setEditingCampusName(e.target.value)}
                        className="w-full text-sm p-2 border border-yellow-100 rounded-lg bg-yellow-50 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingCampusId(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                        <button onClick={handleSaveEditCampus} className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-yellow-600">
                          Ok
                        </button>
                      </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                      <button
                        onClick={() => { setSelectedCampusId(campus.id); setSelectedFloor('all'); setSearchTerm(''); }}
                        className={`flex-1 text-left p-2.5 rounded-xl transition-all flex justify-between items-center group-hover:shadow-sm ${
                          isSelected 
                            ? 'bg-white text-blue-700 font-bold shadow-md ring-1 ring-blue-100' 
                            : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'
                        } ${depth > 0 ? 'ml-6' : ''}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {hasChildren ? (
                                <button 
                                    onClick={(e) => toggleExpand(campus.id, e)}
                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400"
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <div className="w-6 flex justify-center">
                                    {depth > 0 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
                                </div>
                            )}
                            
                            {depth === 0 && (
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                    <Building size={14} />
                                </div>
                            )}
                            <span className={`truncate text-sm ${depth === 0 ? 'font-bold' : ''}`}>{campus.name}</span>
                        </div>
                        
                        {userRole === 'ADMIN' && (
                          <div className={`flex items-center gap-0.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onClick={e => e.stopPropagation()}>
                             
                             {/* ORDERING BUTTONS */}
                             <div className="flex flex-col mr-1 border-r border-slate-200 pr-1">
                                <button 
                                    disabled={isFirst}
                                    onClick={(e) => handleMoveOrder(campus, 'up', e)}
                                    className="p-0.5 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20"
                                >
                                    <ArrowUp size={10} />
                                </button>
                                <button 
                                    disabled={isLast}
                                    onClick={(e) => handleMoveOrder(campus, 'down', e)}
                                    className="p-0.5 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-20"
                                >
                                    <ArrowDown size={10} />
                                </button>
                             </div>

                             <button 
                                onClick={(e) => { e.stopPropagation(); setMovingCampus(campus); }}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                                title="Sposta / Nidifica Sede"
                             >
                                <FolderInput size={14} />
                             </button>

                             <button 
                               onClick={(e) => handleStartEditCampus(campus)}
                               className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                               title="Rinomina"
                             >
                               <Edit2 size={14} />
                             </button>
                             <button 
                               onClick={(e) => handleDeleteCampusClick(campus, e)}
                               className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                               title="Elimina Sede"
                             >
                               <Trash2 size={14} />
                             </button>
                          </div>
                        )}
                      </button>
                  </div>
                )}
        </li>
        {isExpanded && children.map(child => renderCampusItem(child, depth + 1))}
        </React.Fragment>
    )
  };

  // Move Modal Tree Item
  const renderMoveTargetItem = (target: Campus, depth: number) => {
    // 1. Prevent moving to self
    if (movingCampus && target.id === movingCampus.id) return null;
    
    // 2. Prevent moving to a descendant (Cycle check)
    const descendants = movingCampus ? getDescendants(movingCampus.id) : [];
    if (descendants.includes(target.id)) return null;

    const children = campuses.filter(c => c.parentId === target.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedMoveIds.has(target.id);

    return (
        <React.Fragment key={target.id}>
            <div className={`flex items-center ${depth > 0 ? 'ml-6' : ''}`}>
                 {hasChildren ? (
                     <button 
                        onClick={(e) => toggleMoveExpand(target.id, e)}
                        className="p-2 text-slate-400 hover:text-blue-500"
                     >
                        {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                 ) : (
                     <div className="w-8"></div>
                 )}
                 <button
                    onClick={() => handleMoveSubmit(target.id)}
                    className={`flex-1 text-left p-2 my-1 rounded-lg border text-sm flex items-center hover:bg-blue-50 hover:border-blue-200 transition-colors ${
                        movingCampus?.parentId === target.id ? 'bg-blue-50 border-blue-200 font-bold text-blue-700' : 'bg-white border-slate-200'
                    }`}
                >
                    <CornerDownRight size={14} className={`mr-2 ${depth === 0 ? 'text-slate-800' : 'text-slate-400'}`}/>
                    {target.name}
                </button>
            </div>
            {isExpanded && children.map(c => renderMoveTargetItem(c, depth + 1))}
        </React.Fragment>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-120px)] relative">
      
      {/* Sidebar: Campuses Management */}
      <div className="md:col-span-4 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide">
            <MapPin className="mr-2 text-blue-500" size={16} /> Ville & Sedi
          </h3>
          
          {userRole === 'ADMIN' && (
              <div className="flex gap-1">
                 <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="text-green-600 hover:bg-green-100 p-1.5 rounded-lg transition"
                    title="Importa da Excel/CSV"
                  >
                    <FileSpreadsheet size={18} />
                  </button>
                  <button 
                    onClick={() => setIsAddingCampus(true)}
                    className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition"
                    title="Aggiungi Sede"
                  >
                    <Plus size={18} />
                  </button>
              </div>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 bg-slate-50/50">
          {isAddingCampus && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-blue-200 shadow-sm animate-fade-in">
              <input 
                autoFocus
                type="text" 
                placeholder="Nome nuova sede..."
                className="w-full text-sm p-2 border border-slate-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-100 outline-none"
                value={newCampusName}
                onChange={e => setNewCampusName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAddingCampus(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
                <button onClick={handleSaveNewCampus} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm">
                  Salva
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-0.5 pb-4">
            {campuses.filter(c => !c.parentId).map(campus => renderCampusItem(campus, 0))}
          </ul>
        </div>
      </div>

      {/* Main: Bathrooms List */}
      <div className="md:col-span-8 lg:col-span-9 space-y-4 overflow-y-auto pr-2 pb-10">
        {selectedCampus ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    {selectedCampus.name}
                    {selectedCampus.parentId && (
                        <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center">
                            <CornerDownRight size={12} className="mr-1"/>
                            {campuses.find(c => c.id === selectedCampus.parentId)?.name}
                        </span>
                    )}
                </h2>
                <div className="flex items-center text-slate-500 text-xs mt-1">
                    <LayoutGrid size={14} className="mr-1"/>
                    {filteredBathrooms.length} Locali visualizzati
                    {childCampuses.length > 0 && (
                        <span className="ml-3 text-blue-600 font-medium">Include {childCampuses.length} sottosedi</span>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                 {/* SEARCH & FILTER BAR */}
                 <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <div className="relative border-r border-slate-200 pr-2 mr-2">
                         <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" size={14}/>
                         <input 
                            type="text" 
                            placeholder="Cerca locale..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 py-1.5 w-32 md:w-40 bg-transparent text-sm focus:outline-none"
                         />
                    </div>
                    
                    <div className="flex items-center pr-2">
                        <span className="text-xs font-bold text-slate-400 mr-2 uppercase">Piano</span>
                        <select 
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg py-1 px-2 focus:ring-1 focus:ring-blue-200 outline-none"
                        >
                            <option value="all">Tutti</option>
                            {availableFloors.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <button
                    onClick={handleExportCensus}
                    className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-200 transition-all"
                    title="Esporta Censimento CSV"
                 >
                     <Download size={18} />
                 </button>

                 {userRole === 'ADMIN' && (
                    <button 
                        onClick={() => {
                            setActiveBathroom({ gender: GenderType.MALE, floor: '0', code: '', notes: '' });
                            setIsAddingBathroom(true);
                        }}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center shadow-lg shadow-slate-200 ml-2"
                    >
                        <Plus size={16} className="mr-2" /> <span className="hidden md:inline">Nuovo Bagno</span>
                    </button>
                 )}
              </div>
            </div>

            {/* ADD / EDIT BATHROOM MODAL */}
            {(isAddingBathroom || isEditingBathroom) && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 mb-6 animate-fade-in relative z-10">
                <button onClick={() => { setIsAddingBathroom(false); setIsEditingBathroom(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                   <X size={20} />
                </button>
                <h4 className="font-bold mb-4 text-slate-800 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                    {isEditingBathroom ? <Edit2 size={18} /> : <Plus size={18} />}
                  </div>
                  {isEditingBathroom ? `Modifica Bagno: ${activeBathroom.code}` : `Aggiungi locale a ${selectedCampus.name}`}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Codice Locale</label>
                    <input
                      type="text"
                      placeholder="es. WC-01"
                      value={activeBathroom.code || ''}
                      onChange={e => setActiveBathroom({...activeBathroom, code: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Piano</label>
                    <input
                      type="text"
                      placeholder="es. 1"
                      value={activeBathroom.floor || ''}
                      onChange={e => setActiveBathroom({...activeBathroom, floor: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipologia</label>
                    <div className="relative">
                        <select
                        value={activeBathroom.gender}
                        onChange={e => setActiveBathroom({...activeBathroom, gender: e.target.value as GenderType})}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 appearance-none"
                        >
                        {Object.values(GenderType).map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={14}/>
                        </div>
                    </div>
                  </div>
                   {isEditingBathroom && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sede</label>
                        <div className="relative">
                            <select
                                value={activeBathroom.campusId}
                                onChange={e => setActiveBathroom({...activeBathroom, campusId: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 appearance-none"
                            >
                                {campuses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.parentId ? '-- ' : ''}{c.name}
                                    </option>
                                ))}
                            </select>
                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={14}/>
                            </div>
                        </div>
                      </div>
                   )}
                </div>
                
                {/* Note Field */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <Lock size={12} className="mr-1" />
                        Note Accesso / Permessi
                    </label>
                    <textarea 
                        value={activeBathroom.notes || ''}
                        onChange={e => setActiveBathroom({...activeBathroom, notes: e.target.value})}
                        placeholder="Es. Richiesta chiave in portineria, Interno ufficio amministrativo..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 h-20 resize-none"
                    />
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                   <div>
                       {isEditingBathroom && (
                           <button 
                            onClick={handleDeleteBathroomClick}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold flex items-center"
                           >
                               <Trash2 size={16} className="mr-2" /> Elimina Bagno
                           </button>
                       )}
                   </div>
                   <button 
                    onClick={isEditingBathroom ? handleEditBathroomSubmit : handleAddBathroomSubmit}
                    className="bg-blue-600 text-white rounded-xl px-8 py-2.5 text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                  >
                    {isEditingBathroom ? "Salva Modifiche" : "Conferma Inserimento"}
                  </button>
                </div>
              </div>
            )}

            {/* Bathrooms Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredBathrooms.map(bathroom => {
                const lastInsp = getLastInspection(bathroom.id);
                const hasOpenTicket = lastInsp?.ticketCreated && lastInsp?.ticketId; 
                const bCampus = campuses.find(c => c.id === bathroom.campusId);
                const showSubLabel = bCampus && bCampus.id !== selectedCampusId;
                
                return (
                  <div 
                    key={bathroom.id} 
                    onClick={() => {
                        if (userRole === 'ADMIN') {
                            onSelectBathroom(bathroom, bCampus || selectedCampus);
                        }
                    }}
                    className={`bg-white p-3 rounded-xl shadow-sm border border-slate-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden
                        ${userRole === 'ADMIN' ? 'hover:shadow-md hover:border-blue-300 cursor-pointer group' : 'cursor-default'}
                    `}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${hasOpenTicket ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                    {userRole === 'ADMIN' && (
                        <button
                            onClick={(e) => handleEditBathroomClick(bathroom, e)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 z-20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Modifica Dati Bagno"
                        >
                            <Edit2 size={12} />
                        </button>
                    )}

                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold text-slate-800 text-lg transition-colors ${userRole === 'ADMIN' ? 'group-hover:text-blue-700' : ''}`}>{bathroom.code}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                                bathroom.gender === GenderType.MALE ? 'bg-blue-50 text-blue-600' :
                                bathroom.gender === GenderType.FEMALE ? 'bg-pink-50 text-pink-600' :
                                bathroom.gender === GenderType.DISABLED ? 'bg-purple-50 text-purple-600' : 
                                'bg-indigo-50 text-indigo-600'
                            }`}>
                                {bathroom.gender === GenderType.MALE ? 'M' : bathroom.gender === GenderType.FEMALE ? 'F' : bathroom.gender === GenderType.DISABLED ? 'H' : 'All'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Piano {bathroom.floor}</p>
                        {showSubLabel && (
                            <p className="text-[10px] text-blue-500 font-bold mt-1 truncate">{bCampus.name}</p>
                        )}
                    </div>
                    
                    {bathroom.notes && (
                        <div className="mt-1 flex items-start gap-1 p-1 bg-yellow-50 rounded border border-yellow-100">
                             <Info size={10} className="text-yellow-600 mt-0.5 shrink-0" />
                             <p className="text-[10px] text-yellow-700 line-clamp-1 leading-tight">{bathroom.notes}</p>
                        </div>
                    )}

                    <div className="mt-auto pt-2">
                        {hasOpenTicket ? (
                            <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold border border-red-100">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                Ticket
                            </div>
                        ) : lastInsp ? (
                             <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                                <History size={10} className="mr-1" />
                                {new Date(lastInsp.date).toLocaleDateString(undefined, {month:'2-digit', day:'2-digit'})}
                            </div>
                        ) : (
                            <div className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-100 text-center">
                                MAI ISPEZIONATO
                            </div>
                        )}
                    </div>
                  </div>
                );
              })}
              
              {userRole === 'ADMIN' && (
                  <button 
                    onClick={() => {
                        setActiveBathroom({ gender: GenderType.MALE, floor: '0', code: '', notes: '' });
                        setIsAddingBathroom(true);
                    }}
                    className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all h-36"
                  >
                    <Plus size={24} className="mb-1" />
                    <span className="text-xs font-bold">Aggiungi</span>
                  </button>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in">
             <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                 <Building size={48} className="text-slate-200" />
             </div>
             <p className="font-medium">Seleziona una Villa o Sede per iniziare</p>
          </div>
        )}
      </div>

      {/* MOVE CAMPUS MODAL */}
      {movingCampus && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-700">Sposta "{movingCampus.name}"</h3>
                        <p className="text-xs text-slate-500">Seleziona la nuova Sede Madre</p>
                    </div>
                    <button onClick={() => setMovingCampus(null)}><X size={20} className="text-slate-400"/></button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
                    <button 
                        onClick={() => handleMoveSubmit(null)}
                        className={`w-full text-left p-3 mb-2 rounded-lg border text-sm font-bold flex items-center shadow-sm ${
                            movingCampus.parentId === null 
                            ? 'bg-blue-600 text-white border-blue-700' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                    >
                        <Building size={16} className="mr-2"/>
                        Nessuna (Rendi Principale)
                    </button>
                    
                    <div className="border-t border-slate-200 my-2 pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Struttura Sedi</p>
                        {campuses.filter(c => !c.parentId).map(c => renderMoveTargetItem(c, 0))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-green-50">
                      <h3 className="text-lg font-bold text-green-800 flex items-center">
                          <FileSpreadsheet className="mr-2" /> Importa da Excel
                      </h3>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-slate-600 mb-4">
                          Formato CSV richiesto:
                      </p>
                      <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 mb-6">
                          Sede, Piano, ID Bagno, Destinazione, Note<br/>
                          <span className="text-slate-400">es: Villa Centrale, 1, A-101, Uomini, Chiave Portineria</span>
                      </div>
                      
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100">
                            <Upload className="w-8 h-8 mb-3 text-green-500" />
                            <p className="mb-2 text-sm text-slate-500">Clicca per caricare CSV</p>
                            <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </label>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 text-right">
                      <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm mr-2">Annulla</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};