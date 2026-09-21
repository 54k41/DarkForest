# DarkForest

DarkForest é um chatbot web em um único arquivo HTML que utiliza a API da OpenAI, com roteamento inteligente de modelos via Jev e RAG vetorial para documentos. Basta abrir o arquivo no navegador e configurar a chave de API — sem instalação e sem etapa de build.

![HTML5](https://img.shields.io/badge/HTML5-single%20file-orange) ![OpenAI](https://img.shields.io/badge/API-OpenAI-green) ![Google%20Gemini](https://img.shields.io/badge/embeddings-Gemini-blue) ![pt--BR](https://img.shields.io/badge/idioma-pt--BR-blue)

## Funcionalidades

- Chat em tempo real (streaming) com modelos GPT da OpenAI, com exibição do raciocínio.
- Dois modos de roteamento de modelos via [Jev](https://vercel.com/ai-gateway) (Vercel AI Gateway), detalhados na seção [Modos Pro e Lite](#modos-pro-e-lite).
- RAG vetorial: PDFs anexados são divididos em trechos, representados por embeddings do modelo `gemini-embedding-2` (chave do Google Gemini) e armazenados em cache no IndexedDB. A cada pergunta, uma busca por similaridade de cosseno (top-20) seguida de rerank via Jev inclui no prompt apenas os cinco trechos mais relevantes.
- Auto Eco: mecanismos de proteção antes do envio (detecção de jailbreak e de dados pessoais sensíveis), avaliação da resposta após a geração (qualidade e aderência às fontes recuperadas) e organização automática dos chats.
- Chaves de API armazenadas exclusivamente no navegador (localStorage) ou em arquivos locais opcionais (`chatgpt.js`).
- Interface integralmente em português, responsiva, com tema claro e escuro.

## Modos Pro e Lite

O seletor da interface define o par de modelos candidatos. O modelo que responderá cada mensagem — e o esforço de raciocínio aplicado — é definido pelo **Jev**, um modelo de decisão que responde perguntas estruturadas sem gerar texto. Quando o backend do Jev não está configurado, uma heurística local equivalente assume essa função, sem interromper o funcionamento do chat.

| Modo | Modelos candidatos | Esforço de raciocínio |
|------|--------------------|------------------------|
| **Pro** | `gpt-5.4` ou `gpt-5.4-mini`, escolhidos pelo Jev conforme complexidade, anexos e tipo de pedido | Escolhido pelo Jev (`low`, `medium` ou `high`) para qualquer modelo |
| **Lite** | `gpt-5.4-mini` ou `gpt-4.1-mini`, escolhidos pelo Jev; solicitações simples são atendidas pelo `gpt-4.1-mini` | O `gpt-5.4-mini` recebe esforço definido pelo Jev (`low`, `medium` ou `high`), com criação de código fixada em `high`; o `gpt-4.1-mini` responde sem raciocínio |

Regras determinísticas no código complementam a decisão do Jev: no modo **Pro**, anexos, PDFs e solicitações complexas são direcionados ao `gpt-5.4` (via Responses API); no modo **Lite**, a criação de código é direcionada ao `gpt-5.4-mini` com esforço `high`. O modelo e o esforço efetivamente utilizados são exibidos junto a cada resposta.

## Chaves de API

| Chave | Finalidade | Configuração |
|-------|------------|--------------|
| OpenAI (`sk-...`) | Conversação | Informar na interface ou criar um arquivo `chatgpt.js` junto ao HTML com `const OPENAI_API_KEY = "sk-...";` |
| Gemini (`AIza...` ou `AQ....`) | Embeddings do RAG (`gemini-embedding-2`) | Informar no campo de chave de embeddings, nas Configurações |
| NVIDIA (`nvapi-...`) (opcional) | Provedor alternativo de embeddings (`nemotron-3-embed-1b`) | Mesmo campo; o formato da chave determina o provedor |
| Jev (opcional) | Roteamento Pro/Lite e rerank do RAG | Definir `window.JEV_DECIDE_URL` ou `localStorage.jevDecideUrl` apontando para o endpoint `/api/decide` (deploy na Vercel) |

Na ausência de chave de embeddings, o chat opera em modo clássico: o documento é incluído integralmente no prompt, com controle de tamanho. Com uma chave válida, o modo vetorial é ativado automaticamente.

## Como usar

1. Baixe o arquivo `darkforest.html`.
2. Abra-o no navegador (Chrome, Edge ou Firefox).
3. Configure a chave da OpenAI: informe-a na interface ou utilize o arquivo `chatgpt.js`.
4. (Opcional) Ative o RAG vetorial informando uma chave do Gemini nas Configurações.
5. (Opcional) Ative o Jev: publique a `api/decide.js` na Vercel (com `AI_GATEWAY_API_KEY` configurada no painel) e defina a URL do endpoint em `localStorage.jevDecideUrl`.
6. Envie mensagens, anexe PDFs e alterne entre os modos **Pro** e **Lite**.

O uso das APIs é cobrado pelos respectivos provedores conforme o plano contratado.

## Estrutura do projeto

```
darkforest.html   # Aplicação completa (HTML + CSS + JS)
api/decide.js     # Vercel Function (Node 22) — decisões via Jev (opcional)
package.json      # Dependência da função (SDK "ai")
.gitignore        # Ignora segredos (.env, chaves, chatgpt.js)
```

## Segurança

- As chaves permanecem no navegador: a chave da OpenAI é enviada somente para `api.openai.com`, e a chave de embeddings somente para o provedor correspondente.
- Os arquivos `.env`, `chatgpt.js`, `chave_api.js` e `*.key` estão listados no `.gitignore` e não devem ser commitados.
- A chave do AI Gateway (`AI_GATEWAY_API_KEY`) reside exclusivamente no servidor da `api/decide.js`, nunca no HTML.
- Em hospedagens públicas (por exemplo, GitHub Pages), cada usuário da página deverá fornecer a própria chave.

## Tecnologias

- HTML5, CSS3 e JavaScript puro (sem frameworks)
- [PDF.js](https://mozilla.github.io/pdf.js/) para extração de texto de PDFs
- [highlight.js](https://highlightjs.org/) para realce de sintaxe em blocos de código
- OpenAI Responses API (GPT-5.4) e Chat Completions API (demais modelos)
- Google Gemini Embeddings (`gemini-embedding-2`) para o índice vetorial
- [Jev](https://vercel.com/ai-gateway) (via Vercel AI Gateway) para decisão e roteamento — opcional

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
