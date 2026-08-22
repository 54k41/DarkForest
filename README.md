# ChatBox AI - OpenAI

Chatbot web em **um único arquivo HTML** que conversa com a API da OpenAI. Basta abrir o arquivo no navegador, colar sua chave de API e começar a conversar — sem instalação, sem servidor, sem build.

![HTML5](https://img.shields.io/badge/HTML5-single%20file-orange) ![OpenAI](https://img.shields.io/badge/API-OpenAI-green) ![pt--BR](https://img.shields.io/badge/idioma-pt--BR-blue)

## ✨ Funcionalidades

- 💬 Chat em tempo real com modelos GPT da OpenAI
- 📄 Leitura e análise de **PDFs** anexados (via PDF.js)
- 🤖 Seleção de modelo (GPT-4o, GPT-4o-mini e outros)
- 🔑 Chave de API armazenada localmente no navegador (localStorage) ou via arquivo externo opcional `chatgpt.js`
- 🌐 Interface 100% em português, responsiva

## 🚀 Como usar

1. **Baixe o arquivo** `chatbot_gpt.html`
2. **Abra no navegador** (duplo clique — funciona no Chrome, Edge, Firefox)
3. **Configure a chave da API** de uma das formas:
   - Cole a chave diretamente na interface do chat, **ou**
   - Crie um arquivo `chatgpt.js` ao lado do HTML com o conteúdo:
     ```js
     const OPENAI_API_KEY = "sk-...";
     ```
4. Envie mensagens e, se quiser, anexe um PDF para o bot analisar

> ⚠️ Você precisa de uma chave de API válida da [plataforma OpenAI](https://platform.openai.com/api-keys). O uso da API é cobrado pela OpenAI conforme seu plano.

## 📁 Estrutura

```
chatbot_gpt.html   # Aplicação completa (HTML + CSS + JS)
.gitignore         # Ignora segredos (.env, chaves, chatgpt.js)
```

## 🔒 Segurança

- A chave da API **nunca sai do seu navegador** — ela é enviada apenas para `api.openai.com` em cada requisição
- Os arquivos `.env`, `chatgpt.js`, `chave_api.js` e `*.key` estão no `.gitignore` e **não** devem ser commitados
- Se for hospedar publicamente (ex.: GitHub Pages), lembre-se: qualquer pessoa que usar a página precisará fornecer a própria chave

## 🛠️ Tecnologias

- HTML5 + CSS3 + JavaScript puro (sem frameworks)
- [PDF.js](https://mozilla.github.io/pdf.js/) para extração de texto de PDFs
- OpenAI Chat Completions API

## 📄 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
