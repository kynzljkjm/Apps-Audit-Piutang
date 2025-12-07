import { GoogleGenAI } from "@google/genai";
import { UploadedFile } from "../types";

const SYSTEM_INSTRUCTION = `
Anda adalah "AI Audit Piutang", asisten auditor profesional dengan keahlian mendalam dalam auditing, akuntansi keuangan, dan standar audit (ISA, SA, PSAK terkait piutang).

Tujuan Anda: Membantu auditor mengaudit piutang usaha secara otomatis, terstruktur, dan profesional.

Gaya Komunikasi:
- Bahasa Indonesia baku, formal, dan akademik (seperti laporan kertas kerja audit).
- Objektif, skeptis profesional, dan berbasis bukti.
- Jika pengguna bertanya secara lisan (speech-to-text) atau dalam mode percakapan chat, berikan jawaban yang **naratif, mengalir, dan nyaman didengar (ear-friendly)**. Hindari penggunaan simbol markdown yang berlebihan jika tidak perlu, namun tetap pertahankan struktur logis.
- Bertindaklah seolah-olah Anda sedang menjelaskan temuan secara lisan di depan klien atau partner audit.

Struktur Jawaban Wajib (untuk analisis dokumen):
1. Ringkasan Temuan (Identifikasi dokumen dan poin kunci).
2. Analisis Audit Piutang (Kewajaran saldo, aging, anomali).
3. Risiko Audit (Risiko salah saji material, fraud, piutang tak tertagih).
4. Prosedur Audit yang Disarankan (Vouching, tracing, konfirmasi, dll).
5. Kesimpulan Sementara Auditor.

Jika input berupa pertanyaan chat:
- Jawab langsung dengan penjelasan runut.
- Hindari jawaban "ya/tidak" yang terlalu singkat. Berikan konteks dan alasan auditnya.
- Gunakan terminologi audit yang tepat.
`;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeAuditDocument = async (file: UploadedFile): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    Tolong analisis dokumen audit piutang yang saya unggah ini. 
    Lakukan prosedur berikut:
    1. Identifikasi jenis dokumen (Buku Besar, Aging Schedule, Invoice, dll).
    2. Lakukan analisis vertikal/horizontal atau aging analysis jika data tersedia.
    3. Identifikasi "red flags" atau risiko fraud/salah saji.
    4. Berikan rekomendasi prosedur audit substantif maupun test of controls yang relevan.
    
    Sajikan output sesuai format standar yang telah ditetapkan dalam instruksi sistem.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: file.data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for analytical precision
      }
    });

    return response.text || "Gagal menghasilkan analisis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithAuditAssistant = async (
  message: string, 
  history: { role: string; content: string }[], 
  currentFile: UploadedFile | null
): Promise<string> => {
  const ai = getClient();

  // Construct history for the chat model
  // We utilize the helper to format history correctly for the API if needed, 
  // but specific @google/genai helpers might handle this locally in the Chat object.
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  try {
    let messageParts: any[] = [{ text: message }];
    
    // Only attach file if it's explicitly needed or to ensure context availability.
    // For a robust audit assistant, re-injecting the file context (or a summary) is often safer 
    // to ensure the model "sees" the document in the current turn if the history context window is small,
    // though Gemini 1.5/2.0 context is large. We will trust the history for now unless it's the very first interaction with the file in chat.
    // However, to be safe in this stateless-like function call wrapper:
    if (currentFile) {
       // We add the file again only if it's not already deep in history, 
       // but strictly speaking, chat object history should handle it.
       // Let's add a reminder prompt if file is active.
       messageParts.push({ text: `\n\n[System Note: Jawablah dengan mempertimbangkan konteks dokumen ${currentFile.name} yang sedang aktif di workspace]` });
    }

    const result = await chat.sendMessage({
       config: {
         systemInstruction: SYSTEM_INSTRUCTION
       },
       message: {
         role: 'user',
         parts: messageParts
       }
    });

    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";
  }
};