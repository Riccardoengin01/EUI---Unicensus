import { supabase } from './supabase';
import { Campus, Bathroom, Ticket, Inspection, GenderType, User } from '../types';

// --- DEMO MODE CONFIGURATION ---
const isMock = (supabase as any).supabaseUrl?.includes('placeholder') || 
               (supabase as any).supabaseKey === 'placeholder';

// Dati iniziali per la modalità Demo
const MOCK_CAMPUSES: Campus[] = [
  { id: 'c1', name: 'Polo Scientifico (Demo)', parentId: null },
  { id: 'c2', name: 'Villa Storica (Demo)', parentId: null },
  { id: 'c3', name: 'Campus Economia', parentId: null },
  { id: 'c4', name: 'Dependance Villa', parentId: 'c2' }
];

const MOCK_BATHROOMS: Bathroom[] = [
  { id: 'b1', campusId: 'c1', floor: '1', code: 'WC-S101', gender: GenderType.MALE, notes: 'Chiave in portineria' },
  { id: 'b2', campusId: 'c1', floor: '1', code: 'WC-S102', gender: GenderType.FEMALE },
  { id: 'b3', campusId: 'c2', floor: 'PT', code: 'WC-V01', gender: GenderType.DISABLED, notes: 'Accesso tramite rampa laterale' },
  { id: 'b4', campusId: 'c4', floor: 'PT', code: 'WC-DEP-01', gender: GenderType.ALL_GENDER }
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    type: 'Maintenance',
    bathroomCode: 'WC-S101',
    campusName: 'Polo Scientifico (Demo)',
    title: 'Perdita rubinetto lavabo SX',
    description: 'Il rubinetto perde acqua costantemente anche da chiuso.',
    priority: 'Media',
    status: 'Aperto',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notes: []
  },
  {
    id: 't2',
    type: 'WorkRequest',
    campusName: 'Villa Storica (Demo)',
    title: 'Installazione Asciugamani Elettrici',
    description: 'Sostituzione dispenser carta con asciugamani ad aria in tutti i bagni piano terra.',
    priority: 'Bassa',
    estimatedCost: 1200,
    status: 'In Lavorazione',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    notes: [{ id: 'n1', date: new Date().toISOString(), text: 'Richiesta preventivi fornitori.', author: 'Admin' }]
  }
];

// Simulazione Database in memoria per la sessione corrente
const mockDb = {
  campuses: [...MOCK_CAMPUSES],
  bathrooms: [...MOCK_BATHROOMS],
  tickets: [...MOCK_TICKETS],
  inspections: [] as Inspection[],
  viewers: [] as any[] // Mock viewers list
};

export interface Viewer {
  id: string;
  email: string;
  name: string;
  permissions: string; // JSON stringified array of view IDs
  password?: string; // Stored only for this custom auth implementation
  created_at: string;
}

export const api = {
  
  // --- AUTHENTICATION ---
  async login(email: string, password: string): Promise<{user: User | null, error: string | null}> {
    if (isMock) {
        // Mock Login
        if (password === 'admin') {
            return { 
                user: { id: 'mock-admin', email, name: 'Admin User', role: 'ADMIN', permissions: [] }, 
                error: null 
            };
        }
        return { user: null, error: 'Password errata (Demo: usa "admin")' };
    }

    // 1. TENTATIVO LOGIN AMMINISTRATORE (Supabase Auth Standard)
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (data.user) {
        // È un utente registrato su Supabase (Admin o Staff tecnico reale)
        const isAdmin = email.toLowerCase().includes('riccardorighini') || email.includes('admin');
        return { 
            user: {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.full_name || email.split('@')[0],
                role: isAdmin ? 'ADMIN' : 'VIEWER', // Se registrato ma non admin, è viewer base
                permissions: [] // Admin sees everything logic handles empty permissions as "ALL"
            }, 
            error: null 
        };
    }

    // 2. TENTATIVO LOGIN VISITATORE (Tabella Custom)
    // Se Supabase Auth fallisce, controlliamo se è un "Visitatore" creato dall'admin
    if (error) {
        // Query alla tabella custom authorized_viewers
        const { data: viewerData } = await supabase
            .from('authorized_viewers')
            .select('*')
            .eq('email', email)
            .eq('password', password) // Controllo password semplice (NB: in produzione usare hash!)
            .single();

        if (viewerData) {
            let perms: string[] = [];
            try {
                perms = JSON.parse(viewerData.permissions || '[]');
            } catch(e) {
                // Se è "ALL" o vecchio formato, gestiamo come array vuoto o tutto
                if (viewerData.permissions === 'ALL') perms = []; 
            }

            return {
                user: {
                    id: viewerData.id,
                    email: viewerData.email,
                    name: viewerData.name || 'Visitatore',
                    role: 'VIEWER',
                    permissions: perms
                },
                error: null
            };
        }
    }

    return { user: null, error: 'Credenziali non valide.' };
  },

  async logout(): Promise<void> {
    if (!isMock) {
        await supabase.auth.signOut();
        // Clear local storage logic if needed for custom viewer session
    }
  },

  async changePassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
    if (isMock) return { success: true, error: null };

    // Solo per utenti Supabase reali (Admin)
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  },

  async updateProfileName(newName: string): Promise<{ success: boolean; error: string | null }> {
    if (isMock) return { success: true, error: null };

    const { error } = await supabase.auth.updateUser({
        data: { full_name: newName }
    });
    
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  },

  async getCurrentSession(): Promise<User | null> {
    if (isMock) return null;
    
    // Check Supabase Session
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
        const email = data.session.user.email || '';
        const isAdmin = email.toLowerCase().includes('riccardorighini') || email.includes('admin');
        const metaName = data.session.user.user_metadata?.full_name;
        
        return {
            id: data.session.user.id,
            email: email,
            name: metaName || email.split('@')[0],
            role: isAdmin ? 'ADMIN' : 'VIEWER',
            permissions: []
        };
    }
    // Note: Session persistence for "Custom Viewers" would require LocalStorage handling 
    // which is complex for this snippet. Assuming re-login for viewers on refresh for simplicity
    // or relying on browser autofill.
    return null;
  },

  // --- VISITORS / VIEWERS MANAGEMENT ---
  async getViewers(): Promise<Viewer[]> {
    if (isMock) return mockDb.viewers;
    
    const { data, error } = await supabase.from('authorized_viewers').select('*').order('created_at', { ascending: false });
    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data as Viewer[];
  },

  async addViewer(email: string, name: string, password: string, permissions: string[]): Promise<void> {
      if (isMock) {
          mockDb.viewers.push({ 
              id: crypto.randomUUID(), 
              email, 
              name, 
              password,
              permissions: JSON.stringify(permissions), 
              created_at: new Date().toISOString() 
          });
          return;
      }
      const { error } = await supabase.from('authorized_viewers').insert([{
          email,
          name,
          password, // Saving password to table to allow "Admin created" login flow
          permissions: JSON.stringify(permissions)
      }]);
      if (error) throw error;
  },

  async deleteViewer(id: string): Promise<void> {
      if (isMock) {
          mockDb.viewers = mockDb.viewers.filter(v => v.id !== id);
          return;
      }
      const { error } = await supabase.from('authorized_viewers').delete().eq('id', id);
      if (error) throw error;
  },

  // --- CAMPUSES ---
  async getCampuses(): Promise<Campus[]> {
    if (isMock) {
        return Promise.resolve(mockDb.campuses);
    }
    
    const { data, error } = await supabase.from('campuses').select('*').order('order_index', { ascending: true });
    
    if (error) {
        if (error.code === '42703' || error.message?.includes('order_index')) {
            const { data: fallbackData } = await supabase.from('campuses').select('*');
            return fallbackData?.map((c: any) => ({
                id: c.id,
                name: c.name,
                parentId: c.parent_id
            })) || [];
        }
        throw error;
    }

    return data?.map((c: any) => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id
    })) || [];
  },

  async addCampus(campus: Campus): Promise<void> {
    if (isMock) {
        mockDb.campuses.push(campus);
        return Promise.resolve();
    }
    
    let nextOrder = 0;
    try {
        const { data: maxOrderData } = await supabase.from('campuses').select('order_index').order('order_index', { ascending: false }).limit(1);
        nextOrder = (maxOrderData?.[0]?.order_index || 0) + 1;
    } catch(e) {}

    const dbRow: any = {
      id: campus.id,
      name: campus.name,
      parent_id: campus.parentId
    };
    if (nextOrder > 0) dbRow.order_index = nextOrder;

    let { error } = await supabase.from('campuses').insert([dbRow]);
    
    if (error && (error.code === '42703' || error.message?.includes('order_index'))) {
         delete dbRow.order_index;
         const retry = await supabase.from('campuses').insert([dbRow]);
         if (retry.error) throw retry.error;
    } else if (error) {
        throw error;
    }
  },

  async updateCampus(id: string, updates: Partial<Campus>): Promise<void> {
    if (isMock) {
        const idx = mockDb.campuses.findIndex(c => c.id === id);
        if (idx !== -1) mockDb.campuses[idx] = { ...mockDb.campuses[idx], ...updates };
        return Promise.resolve();
    }
    
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;

    const { error } = await supabase.from('campuses').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteCampus(id: string): Promise<void> {
    if (isMock) {
        mockDb.campuses = mockDb.campuses.filter(c => c.id !== id);
        mockDb.bathrooms = mockDb.bathrooms.filter(b => b.campusId !== id);
        return Promise.resolve();
    }
    
    const { data: bathrooms } = await supabase.from('bathrooms').select('id').eq('campus_id', id);
    if (bathrooms && bathrooms.length > 0) {
        const bathroomIds = bathrooms.map(b => b.id);
        await supabase.from('inspections').delete().in('bathroom_id', bathroomIds);
        await supabase.from('bathrooms').delete().eq('campus_id', id);
    }
    await supabase.from('campuses').update({ parent_id: null }).eq('parent_id', id);

    const { error } = await supabase.from('campuses').delete().eq('id', id);
    if (error) throw error;
  },

  async reorderCampuses(campuses: Campus[]): Promise<void> {
    if (isMock) {
        mockDb.campuses = [...campuses];
        return Promise.resolve();
    }
    const updates = campuses.map((c, index) => ({
        id: c.id,
        name: c.name, 
        parent_id: c.parentId,
        order_index: index
    }));
    try {
        await supabase.from('campuses').upsert(updates, { onConflict: 'id' });
    } catch (e) { console.error(e); }
  },

  // --- BATHROOMS ---
  async getBathrooms(): Promise<Bathroom[]> {
    if (isMock) return Promise.resolve(mockDb.bathrooms);
    const { data, error } = await supabase.from('bathrooms').select('*');
    if (error) throw error;
    return data?.map((b: any) => ({
        id: b.id,
        campusId: b.campus_id,
        floor: b.floor,
        code: b.code,
        gender: b.gender,
        notes: b.notes 
    })) || [];
  },

  async addBathroom(bathroom: Bathroom): Promise<void> {
    if (isMock) {
        mockDb.bathrooms.push(bathroom);
        return Promise.resolve();
    }
    const dbRow = {
        id: bathroom.id,
        campus_id: bathroom.campusId,
        floor: bathroom.floor,
        code: bathroom.code,
        gender: bathroom.gender,
        notes: bathroom.notes
    };
    const { error } = await supabase.from('bathrooms').insert([dbRow]);
    if (error) throw error;
  },

  async updateBathroom(bathroom: Bathroom): Promise<void> {
    if (isMock) {
        const idx = mockDb.bathrooms.findIndex(b => b.id === bathroom.id);
        if (idx !== -1) mockDb.bathrooms[idx] = bathroom;
        return Promise.resolve();
    }
    const dbRow = {
        campus_id: bathroom.campusId,
        floor: bathroom.floor,
        code: bathroom.code,
        gender: bathroom.gender,
        notes: bathroom.notes
    };
    const { error } = await supabase.from('bathrooms').update(dbRow).eq('id', bathroom.id);
    if (error) throw error;
  },

  async deleteBathroom(id: string): Promise<void> {
    if (isMock) {
        mockDb.bathrooms = mockDb.bathrooms.filter(b => b.id !== id);
        mockDb.inspections = mockDb.inspections.filter(i => i.bathroomId !== id);
        return Promise.resolve();
    }
    await supabase.from('inspections').delete().eq('bathroom_id', id);
    const { error } = await supabase.from('bathrooms').delete().eq('id', id);
    if (error) throw error;
  },

  async bulkAddBathrooms(campuses: Campus[], bathrooms: Bathroom[]): Promise<void> {
    if (isMock) {
        mockDb.campuses = [...mockDb.campuses, ...campuses];
        mockDb.bathrooms = [...mockDb.bathrooms, ...bathrooms];
        return Promise.resolve();
    }
    if (campuses.length > 0) {
        const { error: cErr } = await supabase.from('campuses').upsert(campuses.map(c => ({
          id: c.id, 
          name: c.name,
          parent_id: c.parentId
        })));
        if (cErr) throw cErr;
    }
    if (bathrooms.length > 0) {
        const dbBathrooms = bathrooms.map(b => ({
            id: b.id,
            campus_id: b.campusId,
            floor: b.floor,
            code: b.code,
            gender: b.gender,
            notes: b.notes
        }));
        const { error: bErr } = await supabase.from('bathrooms').insert(dbBathrooms);
        if (bErr) throw bErr;
    }
  },

  // --- TICKETS & INSPECTIONS ---
  async getTickets(): Promise<Ticket[]> {
    if (isMock) return Promise.resolve(mockDb.tickets);
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data?.map((t: any) => ({
        id: t.id,
        type: t.type,
        inspectionId: t.inspection_id,
        bathroomCode: t.bathroom_code,
        campusName: t.campus_name,
        title: t.title,
        description: t.description,
        priority: t.priority,
        estimatedCost: t.estimated_cost,
        status: t.status,
        createdAt: t.created_at,
        notes: t.notes
    })) || [];
  },

  async createTicket(ticket: Ticket): Promise<void> {
    if (isMock) {
        mockDb.tickets.unshift(ticket);
        return Promise.resolve();
    }
    const dbRow = {
        id: ticket.id,
        type: ticket.type,
        inspection_id: ticket.inspectionId,
        bathroom_code: ticket.bathroomCode,
        campus_name: ticket.campusName,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        estimated_cost: ticket.estimatedCost,
        status: ticket.status,
        created_at: ticket.createdAt,
        notes: ticket.notes
    };
    const { error } = await supabase.from('tickets').insert([dbRow]);
    if (error) throw error;
  },

  async updateTicket(ticket: Ticket): Promise<void> {
    if (isMock) {
        const idx = mockDb.tickets.findIndex(t => t.id === ticket.id);
        if (idx !== -1) mockDb.tickets[idx] = ticket;
        return Promise.resolve();
    }
    const dbRow = {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        notes: ticket.notes,
        estimated_cost: ticket.estimatedCost
    };
    const { error } = await supabase.from('tickets').update(dbRow).eq('id', ticket.id);
    if (error) throw error;
  },

  async deleteTicket(id: string): Promise<void> {
      if (isMock) {
          mockDb.tickets = mockDb.tickets.filter(t => t.id !== id);
          return Promise.resolve();
      }
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
  },

  async getInspections(): Promise<Inspection[]> {
    if (isMock) return Promise.resolve(mockDb.inspections);
    const { data, error } = await supabase.from('inspections').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data?.map((i: any) => ({
        id: i.id,
        bathroomId: i.bathroom_id,
        date: i.date,
        records: i.records,
        ticketCreated: i.ticket_created,
        ticketId: i.ticket_id
    })) || [];
  },

  async createInspection(inspection: Inspection): Promise<void> {
    if (isMock) {
        mockDb.inspections.unshift(inspection);
        return Promise.resolve();
    }
    const dbRow = {
        id: inspection.id,
        bathroom_id: inspection.bathroomId,
        date: inspection.date,
        records: inspection.records,
        ticket_created: inspection.ticketCreated,
        ticket_id: inspection.ticketId
    };
    const { error } = await supabase.from('inspections').insert([dbRow]);
    if (error) throw error;
  },

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<void> {
    if (isMock) {
        const idx = mockDb.inspections.findIndex(i => i.id === id);
        if (idx !== -1) mockDb.inspections[idx] = { ...mockDb.inspections[idx], ...updates };
        return Promise.resolve();
    }
    const dbUpdates: any = {};
    if (updates.ticketCreated !== undefined) dbUpdates.ticket_created = updates.ticketCreated;
    if (updates.ticketId !== undefined) dbUpdates.ticket_id = updates.ticketId;
    
    const { error } = await supabase.from('inspections').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteInspection(id: string): Promise<void> {
      if (isMock) {
          mockDb.inspections = mockDb.inspections.filter(i => i.id !== id);
          return Promise.resolve();
      }
      const { error } = await supabase.from('inspections').delete().eq('id', id);
      if (error) throw error;
  }
};