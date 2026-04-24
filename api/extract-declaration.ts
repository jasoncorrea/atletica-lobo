import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, images } = req.body;
    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Conteúdo não fornecido" });
    }

    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da IA não encontrada. Verifique se a GEMINI_API_KEY está configurada na Vercel.');
    }
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [
      { text: `Analise as imagens ou texto da declaração acadêmica e extraia as seguintes informações: \n        nome_completo, curso, documento, data_emissao. \n        Se não encontrar algum dado, use "Não identificado".` }
    ];

    if (text) {
      parts.push({ text: `Texto extraído:\n---\n${text}\n---` });
    }

    if (images && images.length > 0) {
      images.forEach((imgBase64: string) => {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imgBase64
          }
        });
      });
    }

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
    const result = JSON.parse(jsonStr);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Erro na extração" });
  }
}
