import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Inspection, InspectionRecord, INSPECTION_ITEMS, Ticket } from "../types";

// Helper to get friendly name
const getItemLabel = (id: string) => INSPECTION_ITEMS.find(i => i.id === id)?.label || id;

export const generateTicketFromInspection = async (
  inspection: Inspection,
  bathroomCode: string,
  campusName: string
): Promise<Partial<Ticket>> => {
  
  // FIX: Safe access to process.env to prevent browser crash
  let apiKey = '';
  try {
    apiKey = process.env.API_KEY || '';
  } catch (e) {
    // process undefined in browser without polyfill
    console.warn("Environment 'process' not defined. AI features disabled.");
  }

  if (!apiKey) {
    console.warn("API Key missing. Returning fallback ticket.");
    return {
      title: `Manutenzione Richiesta: ${bathroomCode}`,
      description: "Generazione automatica non disponibile (Manca API Key). Verificare le note dell'ispezione.",
      priority: 'Media'
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Filter only issues
  const issues = inspection.records.filter(r => r.status === 'Attenzione' || r.status === 'Critico');
  
  if (issues.length === 0) return { title: "Nessun problema rilevato", description: "", priority: 'Bassa' };

  const promptText = `
    Analizza i seguenti problemi rilevati durante l'ispezione di un bagno universitario.
    Sede: ${campusName}
    Bagno: ${bathroomCode}
    Data: ${new Date(inspection.date).toLocaleDateString()}

    Problemi rilevati:
    ${issues.map(i => `- ${getItemLabel(i.itemId)}: Stato ${i.status}. Note: ${i.note}`).join('\n')}

    Compito:
    Genera un titolo conciso per il ticket e una descrizione tecnica professionale per la squadra di manutenzione.
    Assegna una priorità (Bassa, Media, Alta) basata sulla gravità (Critico = Alta, problemi strutturali o idraulici = Alta/Media).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Titolo sintetico del ticket" },
      description: { type: Type.STRING, description: "Descrizione dettagliata delle anomalie e azioni richieste" },
      priority: { type: Type.STRING, enum: ["Bassa", "Media", "Alta"] }
    },
    required: ["title", "description", "priority"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as Partial<Ticket>;

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if AI fails
    return {
      title: `Intervento Manutenzione - ${bathroomCode}`,
      description: `Rilevate ${issues.length} anomalie. Si prega di controllare il report completo.`,
      priority: 'Media'
    };
  }
};