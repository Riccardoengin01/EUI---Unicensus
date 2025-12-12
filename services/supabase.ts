import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAZIONE SUPABASE ---

// Funzione helper per leggere le variabili d'ambiente in modo sicuro
// Supporta sia Vite (import.meta.env) che Node/CRA (process.env)
// Questo previene crash (white screen) se l'ambiente di preview non supporta Vite nativamente.
const getEnv = (key: string) => {
  try {
    // 1. Controllo Vite / Modern Browsers
    // Usiamo il cast 'as any' per evitare errori TypeScript se i tipi non sono definiti
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // 2. Controllo Process (Node.js / Webpack / CRA)
    // Controlliamo typeof process per evitare ReferenceError
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora errori di accesso
  }
  return '';
};

// Tenta di recuperare le chiavi con i prefissi standard (VITE_ per Vercel/Vite, REACT_APP_ per CRA)
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. App will start but network requests will fail.');
}

// Inizializza il client. 
// Se mancano le chiavi, usiamo valori placeholder per permettere all'app di avviarsi (renderizzarsi)
// invece di crashare subito. Gli errori di rete verranno gestiti elegantemente in App.tsx.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
