# Guia de Uso — DarkForest

Este guia explica em detalhe como configurar, usar e solucionar problemas do chatbot.

---

## 1. Obtendo uma chave de API da OpenAI

1. Acesse a plataforma da OpenAI e faça login (ou crie uma conta)
2. Vá em **API Keys** → **Create new secret key**
3. Copie a chave (começa com `sk-`) — ela só é exibida uma vez
4. Certifique-se de que sua conta tem créditos/saldo disponível

---

## 2. Configurando a chave

Você tem **duas opções** (escolha uma):

### Opção A — Pela interface (mais simples)

1. Abra o `darkforest.html` no navegador
2. Cole a chave no campo de configuração do chat
3. A chave fica salva no `localStorage` do navegador

### Opção B — Arquivo externo `chatgpt.js`

1. Crie um arquivo chamado `chatgpt.js` **na mesma pasta** do HTML
2. Conteúdo:
   ```js
   const OPENAI_API_KEY = "sk-sua-chave-aqui";
   ```
3. Recarregue a página

> O `chatgpt.js` está no `.gitignore` — nunca será enviado ao repositório. Se você o renomear, o chatbot avisa no console e usa o armazenamento interno.

---

## 3. Usando o chatbot

| Ação | Como fazer |
|------|------------|
| Conversar | Digite na caixa de mensagem e pressione Enter ou clique em enviar |
| Anexar PDF | Use o botão de anexar; o texto do PDF é extraído e enviado ao modelo |
| Trocar de modelo | Selecione o modelo no seletor (ex.: GPT-4o, GPT-4o-mini) |
| Limpar conversa | Use o botão de nova conversa, se disponível |

---

## 4. Modelos disponíveis

- **GPT-4o** — mais capaz, ideal para análise de documentos
- **GPT-4o-mini** — mais rápido e econômico, bom para uso diário

---

## 5. Solução de problemas

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| `401 Unauthorized` | Chave inválida ou revogada | Gere uma nova chave na plataforma OpenAI |
| `429 Too Many Requests` | Limite de uso / sem créditos | Verifique saldo e limites da sua conta |
| Resposta não aparece | Bloqueio de rede / firewall | Verifique se `api.openai.com` está acessível |
| PDF não é lido | PDF escaneado (imagem) | O PDF precisa ter texto selecionável |
| Página em branco | Abriu via `file://` com restrições | Tente outro navegador ou sirva com um servidor local |

**Servidor local (opcional):**
```bash
# Python
python -m http.server 8000
# depois acesse http://localhost:8000/darkforest.html
```

---

## 6. Perguntas frequentes

**A chave fica salva em algum servidor?**
Não. Ela fica apenas no seu navegador (localStorage) e é enviada somente para a API da OpenAI.

**Funciona offline?**
Não — a conversa exige conexão com a API da OpenAI.

**Posso hospedar no GitHub Pages?**
Sim, mas cada pessoa que abrir a página precisará usar a própria chave (ou a sua — não recomendado, pois fica visível no navegador).
