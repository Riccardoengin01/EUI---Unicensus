
export enum GenderType {
  MALE = 'Uomo',
  FEMALE = 'Donna',
  DISABLED = 'Disabile',
  ALL_GENDER = 'All-Gender'
}

export enum InspectionStatus {
  OK = 'OK',
  WARNING = 'Attenzione', // Minor cosmetic / Dirty
  CRITICAL = 'Critico', // Broken, dangerous
  NOT_PRESENT = 'N/A'
}

export type UserRole = 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  permissions?: string[]; // Array of allowed View IDs (e.g. ['dashboard', 'tickets'])
}

export interface InspectionItem {
  id: string;
  category: 'Strutturale' | 'Sanitari' | 'Riscaldamento' | 'Accessibilità';
  label: string;
  isCleaning?: boolean; // Flag to help UI distinction if needed
}

export interface InspectionRecord {
  itemId: string;
  status: InspectionStatus;
  note: string;
}

export interface Inspection {
  id: string;
  bathroomId: string;
  date: string;
  records: InspectionRecord[];
  ticketCreated: boolean;
  ticketId?: string;
}

export interface Bathroom {
  id: string;
  campusId: string;
  floor: string;
  code: string; // e.g., "B-101"
  gender: GenderType;
  notes?: string; // New field for access info (e.g. "Inside Office", "Needs Key")
}

export interface Campus {
  id: string;
  name: string;
  parentId?: string | null; // ID of the parent campus if this is a sub-campus
}

export interface TicketNote {
  id: string;
  date: string;
  text: string;
  author: string;
}

export type TicketType = 'Maintenance' | 'WorkRequest';

export interface Ticket {
  id: string;
  type: TicketType; // Distinguishes between Inspection Maintenance and Extra Work
  inspectionId?: string; // Optional because WorkRequest might not have one
  bathroomCode?: string; // Optional for generic building work
  campusName: string;
  title: string;
  description: string;
  priority: 'Bassa' | 'Media' | 'Alta';
  estimatedCost?: number; // Budget tracking for extra works
  createdAt: string;
  status: 'Aperto' | 'In Lavorazione' | 'Chiuso';
  notes?: TicketNote[]; // History of interactions
}

export const INSPECTION_ITEMS: InspectionItem[] = [
  // Strutturale - Integrità
  { id: 'ceiling', category: 'Strutturale', label: 'Soffitto / Controsoffitto (Infiltrazioni/Distacchi)' },
  { id: 'floor', category: 'Strutturale', label: 'Pavimenti (Integrità/Rotture)' },
  { id: 'floor_clean', category: 'Strutturale', label: 'Pulizia Pavimenti', isCleaning: true },
  
  { id: 'cladding', category: 'Strutturale', label: 'Rivestimenti (Integrità/Piastrelle)' },
  { id: 'cladding_clean', category: 'Strutturale', label: 'Pulizia Rivestimenti (Fughe)', isCleaning: true },
  
  { id: 'walls', category: 'Strutturale', label: 'Pareti (Intonaco/Imbiancatura)' },
  { id: 'walls_clean', category: 'Strutturale', label: 'Pulizia Pareti (Scritte/Macchie)', isCleaning: true },
  
  { id: 'window', category: 'Strutturale', label: 'Finestra / Infissi' },
  { id: 'door', category: 'Strutturale', label: 'Porta / Maniglia' },
  
  // Sanitari
  { id: 'sink', category: 'Sanitari', label: 'Lavandino (Rubinetto/Scarico)' },
  { id: 'bidet', category: 'Sanitari', label: 'Bidet' },
  { id: 'toilet', category: 'Sanitari', label: 'WC / Tavoletta / Scarico' },
  { id: 'shower', category: 'Sanitari', label: 'Doccia / Cabina (Box/Piatto/Erogatore)' },
  { id: 'shower_clean', category: 'Sanitari', label: 'Pulizia Doccia (Calcare/Muffe)', isCleaning: true },

  // Riscaldamento
  { id: 'radiator', category: 'Riscaldamento', label: 'Termosifone/Radiatore' },
  { id: 'radiator_finish', category: 'Riscaldamento', label: 'Finiture (Rosette)' },
  { id: 'thermostatic_valve', category: 'Riscaldamento', label: 'Valvola Termostatica' },
  { id: 'boiler', category: 'Riscaldamento', label: 'Boiler' },

  // Accessibilità (Specifici per Disabili - D.M. 236/89)
  { id: 'acc_door', category: 'Accessibilità', label: 'Porta Accesso (Luce netta ≥ 80cm, Apertura esterna)' },
  { id: 'acc_maneuver', category: 'Accessibilità', label: 'Spazio Manovra (Rotazione 360° Ø 150cm o accostamento)' },
  { id: 'acc_wc_pos', category: 'Accessibilità', label: 'WC: Altezza (45-50cm) e Distanza Muro (>40cm asse)' },
  { id: 'acc_wc_space', category: 'Accessibilità', label: 'WC: Spazio laterale accostamento (min 100cm)' },
  { id: 'acc_bars', category: 'Accessibilità', label: 'Maniglioni Sostegno (h 80cm, Orizzontali/Ribaltabili)' },
  { id: 'acc_sink_struct', category: 'Accessibilità', label: 'Lavabo Sospeso (Bordo h 80cm, Spazio gambe libero)' },
  { id: 'acc_tap', category: 'Accessibilità', label: 'Rubinetto (Leva clinica lunga o Sensore)' },
  { id: 'acc_mirror_h', category: 'Accessibilità', label: 'Specchio (Reclinabile o Bordo inf. < 90cm)' },
  { id: 'acc_alarm_cord', category: 'Accessibilità', label: 'Campanello Allarme (Cordone a terra)' },
];
