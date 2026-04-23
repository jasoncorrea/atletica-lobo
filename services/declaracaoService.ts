import { GoogleGenAI, Type } from "@google/genai";

export async function extractDeclarationInfo(text?: string, images?: string[]) {
  // Priorizamos a chave do ambiente (Backend ou Injetada pelo Vite no Frontend)
  let apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Chave da IA não encontrada. Verifique se a GEMINI_API_KEY está configurada.');
  }

  // Limpeza de segurança
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [
    { text: `Analise as imagens ou texto da declaração acadêmica e extraia as seguintes informações: 
        nome_completo, curso, documento, data_emissao. 
        Se não encontrar algum dado, use "Não identificado".` }
  ];

  if (text) {
    parts.push({ text: `Texto extraído:\n---\n${text}\n---` });
  }

  if (images && images.length > 0) {
    images.forEach(imgBase64 => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imgBase64
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts }],
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
