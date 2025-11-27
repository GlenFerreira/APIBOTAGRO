# 🚀 Guia de Deploy no Render

Este guia explica como fazer o deploy desta API no Render.

## 📋 Pré-requisitos

1. Conta no Render (https://render.com)
2. Repositório Git (GitHub, GitLab, etc.)
3. Variáveis de ambiente configuradas

## 🔧 Configuração no Render

### 1. Criar Novo Web Service

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em **"New +"** e selecione **"Web Service"**
3. Conecte seu repositório Git
4. Configure o serviço:
   - **Name:** `apiagrobot` (ou o nome que preferir)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou outro plano de sua escolha)

### 2. Configurar Variáveis de Ambiente

No painel do serviço, vá em **Environment** e adicione as seguintes variáveis:

```env
# USDA PSD API
USDA_PSD_API_KEY=sua_chave_usda_aqui
USDA_PSD_BASE_URL=https://api.fas.usda.gov

# Windy API
WINDY_API_KEY=sua_chave_windy_aqui

# OpenWeather API
OPENWEATHER_API_KEY=sua_chave_openweather_aqui
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# OpenAI (opcional - para normalização de texto)
OPENAI_API_KEY=sua_chave_openai_aqui

# Node Environment
NODE_ENV=production
```

**Nota:** O Render define automaticamente a variável `PORT`, não é necessário configurá-la manualmente.

### 3. Deploy Automático

O Render fará o deploy automaticamente quando você:
- Fizer push para a branch principal do repositório
- Fizer merge de uma pull request

### 4. Verificar Deploy

Após o deploy, você pode verificar se está funcionando:

- **Health Check:** `https://seu-servico.onrender.com/health`
- **Documentação:** `https://seu-servico.onrender.com/api-docs`
- **API Base:** `https://seu-servico.onrender.com/`

## 📝 Arquivos Importantes

### `index.js`
Servidor Express principal com todas as rotas da API.

### `package.json`
Define as dependências e scripts do projeto.

### `render.yaml` (Opcional)
Arquivo de configuração do Render. Se você usar este arquivo, o Render aplicará essas configurações automaticamente.

### `.gitignore`
Garante que arquivos desnecessários não sejam enviados ao repositório.

## 🔍 Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para testar

### Erro: "Port already in use"
- O Render define automaticamente a variável `PORT`
- Certifique-se de que o código usa `process.env.PORT || 3000`

### Erro: "Module not found"
- Verifique se os imports estão usando caminhos relativos corretos
- Certifique-se de que o `package.json` tem `"type": "module"` para ES6 modules

### Build falha
- Verifique os logs do build no Render
- Teste o build localmente: `npm install`

### Servidor não inicia
- Verifique os logs do servidor no Render
- Teste localmente: `npm start`

## 📚 Recursos Adicionais

- [Documentação do Render](https://render.com/docs)
- [Render Dashboard](https://dashboard.render.com)
- [Node.js no Render](https://render.com/docs/node-version)

## ✅ Checklist de Deploy

- [ ] Repositório conectado ao Render
- [ ] Variáveis de ambiente configuradas
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Health Check configurado: `/health`
- [ ] Testado localmente antes do deploy
- [ ] Verificado que o servidor inicia corretamente
- [ ] Testado endpoints principais após deploy

## 🎉 Pronto!

Após seguir estes passos, sua API estará disponível no Render e será atualizada automaticamente a cada push no repositório.

