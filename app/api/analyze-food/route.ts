import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { image, handProfile } = await req.json();
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: image },
        },
        {
          type: 'text',
          text: `Analise esta foto de comida. A pessoa tem palma de ${handProfile.palmCm}cm e punho de ${handProfile.fistCm}cm — use como referência se a mão estiver visível. Retorne APENAS JSON válido sem markdown: {"items":[{"name":"","grams":0,"kcal":0,"p":0,"c":0,"f":0}],"total_kcal":0,"confidence":"alta|média|baixa","note":""}`,
        },
      ],
    }],
  });
  const text = msg.content.map(c => c.type === 'text' ? c.text : '').join('').replace(/```json|```/g, '').trim();
  return Response.json(JSON.parse(text));
}
