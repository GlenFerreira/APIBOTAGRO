# 📚 Documentação Swagger - Como Usar

Este diretório contém os arquivos de especificação OpenAPI/Swagger para todas as APIs independentes.

## 📄 Arquivos Disponíveis

- **`swagger.yaml`** - Especificação OpenAPI 3.0 em formato YAML
- **`swagger.json`** - Especificação OpenAPI 3.0 em formato JSON

Ambos os arquivos contêm a mesma documentação, apenas em formatos diferentes.

## 🚀 Como Usar

### 1. Swagger Editor Online

1. Acesse: https://editor.swagger.io/
2. Clique em **File > Import File**
3. Selecione o arquivo `swagger.yaml` ou `swagger.json`
4. A documentação será exibida e você poderá testar as APIs diretamente

### 2. Postman

1. Abra o Postman
2. Clique em **Import**
3. Selecione **File** e escolha `swagger.yaml` ou `swagger.json`
4. Todas as rotas serão importadas como uma coleção
5. Você poderá testar todas as APIs diretamente no Postman

### 3. Insomnia

1. Abra o Insomnia
2. Clique em **Create > Import From > File**
3. Selecione `swagger.yaml` ou `swagger.json`
4. As rotas serão importadas e você poderá testá-las

### 4. Visual Studio Code

1. Instale a extensão **"OpenAPI (Swagger) Editor"**
2. Abra o arquivo `swagger.yaml` ou `swagger.json`
3. Use o preview para visualizar a documentação
4. Use a extensão para validar a especificação

### 5. Swagger UI Local

Se você quiser servir o Swagger UI localmente:

```bash
# Instalar swagger-ui-serve globalmente
npm install -g swagger-ui-serve

# Servir o arquivo YAML
swagger-ui-serve swagger.yaml

# Ou servir o arquivo JSON
swagger-ui-serve swagger.json
```

Acesse `http://localhost:3001` para ver a documentação.

### 6. Integração com o Servidor

O servidor principal (`index.js`) já está configurado para servir o Swagger UI em:
- **Produção:** https://apibotagro.onrender.com/api-docs
- **Local:** http://localhost:3000/api-docs

A documentação no servidor é gerada automaticamente a partir dos comentários JSDoc no código.

## 📋 O que está Documentado

### APIs Independentes (v1)

- ✅ `/api/v1/usda/commodity` - Busca dados de commodity por nome
- ✅ `/api/v1/weather/forecast` - Previsão do tempo para 5 dias
- ✅ `/api/v1/weather/current` - Clima atual
- ✅ `/api/v1/clima/generate` - Gera imagem de previsão
- ✅ `/api/v1/clima/images` - Lista imagens disponíveis

### Outras APIs

- ✅ `/api/geolocalizacao/upload` - Upload e processamento de arquivos geográficos
- ✅ `/api/geolocalizacao/info` - Informações do módulo
- ✅ `/health` - Health check

## 🔄 Atualizando a Documentação

Se você adicionar novas rotas ou modificar existentes:

1. Atualize o arquivo `swagger.yaml` ou `swagger.json`
2. Valide a especificação usando o Swagger Editor
3. Teste as rotas importadas no Postman/Insomnia
4. Atualize o README.md se necessário

## ✅ Validação

Para validar se o arquivo Swagger está correto:

1. Use o Swagger Editor: https://editor.swagger.io/
2. Ou use a CLI do Swagger:
   ```bash
   npm install -g @apidevtools/swagger-cli
   swagger-cli validate swagger.yaml
   ```

## 📝 Notas

- Os arquivos estão em formato OpenAPI 3.0
- Todos os schemas estão definidos em `components/schemas`
- Exemplos de requisições e respostas estão incluídos
- Os servidores de produção e local estão configurados

## 🔗 Links Úteis

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

