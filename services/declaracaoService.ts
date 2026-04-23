import { GoogleGenAI, Type } from "@google/genai";

export async function extractDeclarationInfo(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Chave da IA não encontrada. Certifique-se de que "GEMINI_API_KEY" está configurada no painel de Secrets.');
  }

  // Debug (safe)
  console.log('Gemini API Key detected. Length:', apiKey?.length);
  if (apiKey.includes(' ') || apiKey.length < 20) {
    console.warn('Gemini API Key looks suspicious (too short or contains spaces).');
  }

  const ai = new GoogleGenAI({ apiKey });

  if (!text || text.trim().length < 10) {
    throw new Error('Texto insuficiente extraído do PDF.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analise o texto da declaração acadêmica e extraia as seguintes informações: 
        nome_completo, curso, documento, data_emissao. 
        Se não encontrar algum dado, use "Não identificado".
        Texto:
        ---
        ${text}
        ---
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nome_completo: { type: Type.STRING },
            curso: { type: Type.STRING },
            documento: { type: Type.STRING },
            data_emissao: { type: Type.STRING },
          },
          required: ["nome_completo", "curso", "documento", "data_emissao"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error extracting info with Gemini:", error);
    throw error;
  }
}
