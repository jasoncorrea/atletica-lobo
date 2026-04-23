import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractDeclarationInfo } from '../services/declaracaoService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, images } = req.body;
    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Conteúdo não fornecido" });
    }

    const result = await extractDeclarationInfo(text, images);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Erro na extração" });
  }
}
