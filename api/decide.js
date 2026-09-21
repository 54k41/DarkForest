// /api/decide — Vercel Function (Node 22) que chama o Jev server-side.
// A chave vive SOMENTE aqui, nunca no HTML. Uma única variável no .env serve
// para qualquer um dos dois provedores — a detecção é automática:
//   JEV_API_KEY=vck_...  (ou vck-...) -> Vercel AI Gateway (via AI SDK)
//   JEV_API_KEY=<outra chave>         -> API direta da TypeSafe AI
//                                        (POST https://api.typesafe.ai/v1/systemone)
// Legado: AI_GATEWAY_API_KEY ainda é aceita se JEV_API_KEY não existir.
//
// O front fala um schema simplificado (choice com `options`, score com escala
// em texto); o adaptador abaixo converte para o schema de `criteria` que os
// dois provedores exigem e normaliza as respostas de volta — o contrato com o
// darkforest.html é idêntico nos dois provedores:
//   POST { state, questions }                 -> 200 { questions: { nome: valor } }
//   POST { items: [{ state, questions }, ..] } -> 200 [ { questions: {...} }, .. ]
//     boolean -> {probability} | choice -> {choice, probabilities} | score -> {score}
//   Em caso de erro: status >= 400 com { error }. O front trata qualquer falha
//   como "sem Jev" e cai na heurística local (zero breaking change).
//
// Deploy: defina JEV_API_KEY no arquivo .env da raiz do projeto (usado pelo
// `vercel dev` e pela publish da Vercel); em produção, a variável também pode
// ser configurada no dashboard da Vercel.

import { experimental_evaluate as evaluate } from 'ai';

const GATEWAY_MODEL = 'typesafe-ai/jev';
const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
const TYPESAFE_MODEL = 'jev-latest';
const TYPESAFE_TIMEOUT_MS = 15000;
const TYPESAFE_RETRIES = 2; // 429/529: a doc manda backoff exponencial

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const KEY = String(process.env.JEV_API_KEY || process.env.AI_GATEWAY_API_KEY || '').trim();
const IS_GATEWAY_KEY = /^(vck[_-])/.test(KEY);

// O SDK lê a chave da env AI_GATEWAY_API_KEY; com o nome novo, injetamos aqui.
if (IS_GATEWAY_KEY) process.env.AI_GATEWAY_API_KEY = KEY;

// ---------- Adaptador: perguntas do front -> schema de criteria ----------

// Score sem criteria: a escala vem no texto da instrução. 'De 1 ... a 5' vira
// rubrica 1..5 (o front espera o valor nessa escala p/ complexidade); o resto
// vira 0..1 em 10 níveis. A rubrica guardada aqui é o que o normalizador usa
// para converter o score (índice ponderado 0-based) de volta à escala do front.
function toSpecQuestion(q, { noulNaming }) {
  const type = (q && q.type) || 'boolean';
  const out = { type, instructions: String((q && q.instructions) || '') };
  let rubric = null;

  if (type === 'boolean') {
    if (noulNaming) out.type = 'noul';
    if (q.criteria && (q.criteria.true || q.criteria.false)) {
      out.criteria = { true: q.criteria.true, false: q.criteria.false };
    }
  } else if (type === 'choice') {
    out.criteria = (q.criteria && typeof q.criteria === 'object' && !Array.isArray(q.criteria))
      ? q.criteria
      : Object.fromEntries((q.options || []).map(o => [o, null]));
  } else if (type === 'score') {
    if (Array.isArray(q.criteria) && q.criteria.length >= 2) {
      out.criteria = q.criteria;
      rubric = { levels: q.criteria.length, base: 0 };
    } else if (/de\s+1\b[\s\S]{0,40}\ba\s+5\b/i.test(out.instructions)) {
      rubric = { levels: 5, base: 1, labels: ['1 — mínimo', '2 — baixo', '3 — médio', '4 — alto', '5 — máximo'] };
      out.criteria = rubric.labels;
    } else {
      const n = 10;
      rubric = { levels: n, base: 0, labels: Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(1)) };
      out.criteria = rubric.labels;
    }
  }
  return { question: out, rubric };
}

// O score dos dois provedores vem como índice ponderado da rubrica (0-based,
// pode cair entre níveis). O front espera a escala da instrução: 0..1 ou 1..5.
// Quando a legenda é numérica (nossas rubricas são), a média ponderada dos
// valores da legenda já sai na escala certa.
function scoreToClientScale(answer, rubric) {
  const s = (answer && typeof answer.score === 'number') ? answer.score : NaN;
  if (Number.isNaN(s)) return NaN;
  const legend = (answer && answer.legend && typeof answer.legend === 'object') ? answer.legend : null;
  if (legend && answer.probabilities && typeof answer.probabilities === 'object') {
    let exp = 0, total = 0, ok = true;
    for (const [idx, p] of Object.entries(answer.probabilities)) {
      const v = parseFloat(legend[idx]);
      if (!Number.isFinite(v)) { ok = false; break; }
      if (typeof p === 'number') { exp += v * p; total += p; }
    }
    if (ok && total > 0) return exp / total;
  }
  if (rubric && rubric.base === 1) return s + 1;
  if (rubric && rubric.levels > 1) return s / (rubric.levels - 1);
  return s;
}

function answerToClient(a, rubric) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'noul' || typeof a.noul === 'number') return { probability: a.noul };
  if (a.type === 'boolean' || typeof a.probability === 'number' || typeof a === 'boolean') {
    return { probability: typeof a === 'boolean' ? (a ? 1 : 0) : a.probability };
  }
  if (a.type === 'choice' || (a.choice !== undefined && a.probabilities)) {
    return { choice: a.choice, probabilities: a.probabilities, confidence: a.confidence };
  }
  if (a.type === 'score' || typeof a.score === 'number') {
    const v = scoreToClientScale(a, rubric);
    return Number.isNaN(v) ? null : { score: v };
  }
  return null;
}

// ---------- Provedor 1: Vercel AI Gateway (AI SDK) ----------

async function runGateway({ state, questions }) {
  const pairs = Object.entries(questions || {}).map(([id, q]) => [id, toSpecQuestion(q, { noulNaming: false })]);
  const result = await evaluate({
    model: GATEWAY_MODEL,
    state: String(state || '').slice(0, 32000), // limite do contexto do Jev
    questions: Object.fromEntries(pairs.map(([id, p]) => [id, p.question])),
  });
  const rubrics = Object.fromEntries(pairs.map(([id, p]) => [id, p.rubric]));
  const answers = (result && (result.answers || result.questions || result.object)) || result;
  const out = {};
  for (const [id, a] of Object.entries(answers)) {
    const v = answerToClient(a, rubrics[id]);
    if (v !== null) out[id] = v;
  }
  return { questions: out };
}

// ---------- Provedor 2: API direta da TypeSafe AI ----------

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTypesafe({ state, questions }) {
  const pairs = Object.entries(questions || {}).map(([id, q]) => [id, toSpecQuestion(q, { noulNaming: true })]);
  const body = {
    model: TYPESAFE_MODEL,
    state: String(state || '').slice(0, 32000),
    questions: Object.fromEntries(pairs.map(([id, p]) => [id, p.question])),
  };
  const rubrics = Object.fromEntries(pairs.map(([id, p]) => [id, p.rubric]));

  let lastError = null;
  for (let attempt = 0; attempt < TYPESAFE_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TYPESAFE_TIMEOUT_MS);
    let resp;
    try {
      resp = await fetch(TYPESAFE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      lastError = err;
      continue; // rede/timeout: tenta de novo (o backoff abaixo limita a rajada)
    } finally {
      clearTimeout(timer);
    }
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      const answers = (data && data.answers) || {};
      const out = {};
      for (const [id, a] of Object.entries(answers)) {
        const v = answerToClient(a, rubrics[id]);
        if (v !== null) out[id] = v;
      }
      return { questions: out };
    }
    if (resp.status === 429 || resp.status === 529) {
      lastError = new Error(`TypeSafe ${resp.status}`);
      await sleep(400 * (attempt + 1));
      continue;
    }
    const detail = await resp.text().catch(() => '');
    throw new Error(`TypeSafe ${resp.status}: ${detail.slice(0, 200)}`);
  }
  throw lastError || new Error('TypeSafe indisponível');
}

const runOne = IS_GATEWAY_KEY ? runGateway : runTypesafe;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    return res.end(JSON.stringify({ error: 'POST only' }));
  }
  if (!KEY) {
    res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    return res.end(JSON.stringify({ error: 'JEV_API_KEY ausente no .env (chave do Vercel AI Gateway ou da TypeSafe AI)' }));
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
