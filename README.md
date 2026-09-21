# DarkForest

**DarkForest** é um chatbot web em **um único arquivo HTML** que conversa com a API da OpenAI, com **roteamento inteligente de modelos via Jev** e **RAG vetorial** para documentos. Basta abrir o arquivo no navegador, colar sua chave de API e começar a conversar — sem instalação, sem build.

![HTML5](https://img.shields.io/badge/HTML5-single%20file-orange) ![OpenAI](https://img.shields.io/badge/API-OpenAI-green) ![Google%20Gemini](https://img.shields.io/badge/embeddings-Gemini-blue) ![pt--BR](https://img.shields.io/badge/idioma-pt--BR-blue)

## ✨ Funcionalidades

- 💬 Chat em tempo real (streaming) com modelos GPT da OpenAI, com exibição do raciocínio
- 🧭 **Dois modos de roteamento via Jev** ([typesafe-ai/jev](https://vercel.com/ai-gateway), Vercel AI Gateway) — veja detalhes abaixo
- 📄 **RAG vetorial**: PDFs anexados são divididos em chunks, embeddados com o modelo `gemini-embedding-2` (chave do Gemini) e cacheados no IndexedDB — a cada pergunta, busca por cosseno (top-20) + rerank via Jev deixam no prompt só os 5 trechos realmente relevantes
- 🛡️ **Auto Eco**: guardrails antes do envio (detecção de jailbreak e PII), avaliação pós-resposta (qualidade, resposta apoiada nas fontes) e organização automática dos chats
- 🔑 Todas as chaves ficam no seu navegador (localStorage) ou em arquivos locais opcionais (`chatgpt.js`)
- 🌐 Interface 100% em português, responsiva, com tema claro/escuro

## 🧭 Modos Pro e Lite

O seletor da interface escolhe o **par de modelos**; quem decide qual modelo responder (e com quanto esforço de raciocínio) é o **Jev**, um modelo de decisão que responde perguntas tipadas sem gerar texto. Sem backend do Jev configurado, uma heurística local equivalente assume — o chat nunca quebra.

| Modo | Modelos candidatos | Effort de raciocínio |
|------|--------------------|----------------------|
| **Pro** | `gpt-5.4` ou `gpt-5.4-mini` — escolhidos pelo Jev conforme complexidade, anexos e tipo de pedido | Escolhido pelo Jev (`low`, `medium` ou `high`) para qualquer modelo |
| **Lite** | `gpt-5.4-mini` ou `gpt-4.1-mini` — escolhidos pelo Jev; tarefas simples ("eco") vão para o 4.1-mini | `gpt-5.4-mini` recebe effort escolhido pelo Jev (`low`, `medium`, `high`); criar código força `high`. O `gpt-4.1-mini` responde sem raciocínio |

Regras fixas no código complementam o Jev: no **Pro**, anexos/PDFs e pedidos complexos escalam para o `gpt-5.4` (via Responses API); no **Lite**, código de programação sobe direto para o `gpt-5.4-mini` com effort `high`. O modelo e o effort usados aparecem como badge em cada resposta.

## 🔑 Chaves de API

| Chave | Para quê | Como configurar |
|-------|----------|-----------------|
| OpenAI (`sk-...`) | Conversar | Cole na interface ou crie um `chatgpt.js` ao lado do HTML com `const OPENAI_API_KEY = "sk-...";` |
| Gemini (`AIza...` ou `AQ....`) | **Embeddings do RAG** (`gemini-embedding-2`) | Cole nas Configurações, no campo de chave de embeddings |
| NVIDIA (`nvapi-...`) *(opcional)* | Alternativa de embeddings (`nemotron-3-embed-1b`) | Mesmo campo — o formato da chave define o provedor |
| Jev *(opcional)* | Roteamento Pro/Lite e rerank do RAG | Defina `window.JEV_DECIDE_URL` ou `localStorage.jevDecideUrl` apontando para o `/api/decide` (deploy Vercel) |

> Sem chave de embeddings, o chat funciona no **modo clássico**: o documento vai inteiro no prompt (com triagem de tamanho). Com chave válida, o **modo vetorial** é ativado automaticamente.

## 🚀 Como usar

1. **Baixe o arquivo** `darkforest.html`
2. **Abra no navegador** (duplo clique — funciona no Chrome, Edge, Firefox)
3. **Configure a chave da OpenAI** (cole na interface ou use o `chatgpt.js`)
4. *(Opcional)* **Ative o RAG vetorial**: cole uma chave do Gemini nas Configurações
5. *(Opcional)* **Ative o Jev**: faça deploy da `api/decide.js` na Vercel (com `AI_GATEWAY_API_KEY` no dashboard) e defina a URL em `localStorage.jevDecideUrl`
6. Envie mensagens, anexe PDFs e alterne entre os modos **Pro** e **Lite**

> ⚠️ O uso das APIs é cobrado pelos respectivos provedores conforme seu plano.

## 📁 Estrutura

```
darkforest.html   # Aplicação completa (HTML + CSS + JS)
api/decide.js     # Vercel Function (Node 22) — decisões via Jev (opcional)
package.json      # Dependência da função (sdk "ai")
.gitignore        # Ignora segredos (.env, chaves, chatgpt.js)
```

## 🔒 Segurança

- As chaves **nunca saem do seu navegador** — a da OpenAI vai apenas para `api.openai.com`, e a de embeddings apenas para o provedor escolhido
- Os arquivos `.env`, `chatgpt.js`, `chave_api.js` e `*.key` estão no `.gitignore` e **não** devem ser commitados
- A chave do AI Gateway (`AI_GATEWAY_API_KEY`) fica **só no server-side** da `api/decide.js`, nunca no HTML
- Se for hospedar publicamente (ex.: GitHub Pages), lembre-se: cada pessoa que usar a página precisará fornecer a própria chave

## 🛠️ Tecnologias

- HTML5 + CSS3 + JavaScript puro (sem frameworks)
- [PDF.js](https://mozilla.github.io/pdf.js/) para extração de texto de PDFs
- [highlight.js](https://highlightjs.org/) para coloração de sintaxe nos blocos de código
- OpenAI Responses API (GPT-5.4) e Chat Completions API (demais modelos)
- Google Gemini Embeddings (`gemini-embedding-2`) para o índice vetorial
- [Jev](https://vercel.com/ai-gateway) (via Vercel AI Gateway) para decisão/roteamento — opcional

## 📄 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
