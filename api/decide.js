// /api/decide — Vercel Function (Node 22) que chama o Jev server-side.
// A chave do Vercel AI Gateway (AI_GATEWAY_API_KEY) vive SOMENTE aqui, nunca no HTML.
//
// Contrato (usado pelo darkforest.html):
//   POST { state, questions }                 -> 200 { questions: { nome: valor } }
//   POST { items: [{ state, questions }, ..] } -> 200 [ { questions: {...} }, .. ]
//   Em caso de erro: status >= 400 com { error }. O front trata qualquer falha
//   como "sem Jev" e cai na heurística local (zero breaking change).
//
// Deploy: defina AI_GATEWAY_API_KEY no arquivo .env da raiz do projeto (usado
// pelo `vercel dev` e pela publish da Vercel); em produção, a variável também
// pode ser configurada no dashboard da Vercel.

import { experimental_evaluate as evaluate } from 'ai';

const MODEL = 'typesafe-ai/jev';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// O evaluate retorna decisões tipadas; normaliza para { questions: {...} }.
function normalize(result) {
  if (result && result.questions) return { questions: result.questions };
  if (result && result.object) return { questions: result.object };
  return { questions: result };
}

async function runOne({ state, questions }) {
  return normalize(await evaluate({
    model: MODEL,
    state: String(state || '').slice(0, 32000), // limite do contexto do Jev
    questions,
  }));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    return res.end(JSON.stringify({ error: 'POST only' }));
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const out = Array.isArray(body.items)
      ? await Promise.all(body.items.map(runOne)) // decisões paralelas (padrão NanoJev)
      : await runOne(body);

    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify(out));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: String((err && err.message) || err) }));
  }
}
