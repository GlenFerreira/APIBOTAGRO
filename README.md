# 🚀 API - Módulos Independentes

Este diretório contém todas as APIs independentes que podem ser usadas **sem depender do bot WhatsApp**. Cada módulo é uma API REST completa que recebe parâmetros e retorna dados estruturados em JSON.

## 📋 Índice

- [Estrutura](#estrutura)
- [APIs Independentes (v1)](#apis-independentes-v1)
  - [USDA - Commodities](#usda---commodities)
  - [OpenWeather - Clima](#openweather---clima)
  - [Clima - Geração de Imagens](#clima---geração-de-imagens)
- [Módulos Disponíveis](#módulos-disponíveis)
  - [USDA - Commodities Agrícolas](#usda---commodities-agrícolas)
  - [OpenWeather - Previsão do Tempo](#openweather---previsão-do-tempo)
  - [Clima - Geração de Imagens](#clima---geração-de-imagens)
  - [Geolocalização - Processamento de Propriedades](#geolocalização---processamento-de-propriedades)
  - [Utils - Utilitários](#utils---utilitários)
- [API REST](#api-rest)
- [Configuração](#configuração)
- [Documentação Swagger](#documentação-swagger)

## 📁 Estrutura

```
API/
├── USDA/                    # Módulo de commodities agrícolas
│   ├── config.js           # Configuração da API USDA
│   ├── psdService.js       # Serviço de comunicação com a API
│   ├── commodityHandler.js # Handler para processar mensagens do bot
│   └── commodityController.js # Controller para APIs independentes
├── openweather/            # Módulo de previsão do tempo
│   ├── config.js           # Configuração da API OpenWeather
│   ├── weatherService.js   # Serviço de comunicação com a API
│   ├── weatherHandler.js   # Handler para processar mensagens do bot
│   └── weatherController.js # Controller para APIs independentes
├── clima/                  # Módulo de geração de imagens
│   ├── config.js           # Configuração da API Windy
│   ├── forecastEMCWF.mjs   # Script de geração de imagens
│   ├── climaController.js  # Controller para APIs independentes
│   └── [pastas de imagens]/ # Imagens geradas por camada
├── geolocalizacao/         # Módulo de processamento de propriedades
│   ├── config.js           # Configuração do módulo
│   ├── propertyService.js  # Serviço de processamento de arquivos
│   └── propertyHandler.js  # Handler para processar propriedades
├── utils/                  # Utilitários compartilhados
│   └── textNormalizer.js   # Normalização de texto com IA
├── .env                    # Variáveis de ambiente dos módulos
└── README.md               # Este arquivo
```

## 🚀 APIs Independentes (v1)

Todas as APIs abaixo são **totalmente independentes** do bot WhatsApp. Elas podem ser usadas por qualquer cliente HTTP, sem necessidade de configuração do WhatsApp.

### 🌾 USDA - Commodities

#### Buscar dados por nome

```http
GET /api/v1/usda/commodity?name=milho&year=2024&country=BR
```

**Parâmetros:**
- `name` (obrigatório): Nome da commodity (ex: milho, soja, trigo, café, algodão, açúcar, arroz)
- `year` (opcional): Ano dos dados (padrão: ano atual)
- `country` (opcional): Código do país (padrão: BR)

**Exemplo de resposta:**
```json
{
  "success": true,
  "commodity": {
    "name": "milho",
    "code": "0440000",
    "country": "BR",
    "year": 2024
  },
  "data": {
    "production": {
      "value": 125000,
      "formatted": "125.000 mil toneladas"
    },
    "exports": {
      "value": 45000,
      "formatted": "45.000 mil toneladas"
    },
    "endingStocks": {
      "value": 12000,
      "formatted": "12.000 mil toneladas"
    }
  },
  "timestamp": "2024-11-19T10:00:00.000Z"
}
```

**Exemplo de uso:**
```bash
# Local
curl "http://localhost:3000/api/v1/usda/commodity?name=soja&year=2024"

# Produção
curl "https://apibotagro.onrender.com/api/v1/usda/commodity?name=milho"
```

### 🌤️ OpenWeather - Clima

#### Previsão para 5 dias

```http
GET /api/v1/weather/forecast?city=São Paulo
```

**Parâmetros:**
- `city` (obrigatório): Nome da cidade

**Exemplo de resposta:**
```json
{
  "success": true,
  "city": {
    "name": "São Paulo",
    "country": "BR",
    "state": "São Paulo",
    "coordinates": {
      "lat": -23.5505,
      "lon": -46.6333
    }
  },
  "forecasts": [
    {
      "date": "2024-11-19T12:00:00.000Z",
      "dateFormatted": "Terça-feira, 19 de novembro",
      "icon": "☁️",
      "description": "nuvens dispersas",
      "temperature": {
        "current": 23,
        "min": 23,
        "max": 24
      },
      "humidity": 62,
      "windSpeed": 24,
      "rain": 0
    }
  ],
  "hasImage": true,
  "imagePath": "/path/to/image.png",
  "timestamp": "2024-11-19T10:00:00.000Z"
}
```

#### Clima atual

```http
GET /api/v1/weather/current?city=São Paulo
```

**Parâmetros:**
- `city` (obrigatório): Nome da cidade

**Exemplo de uso:**
```bash
# Local
curl "http://localhost:3000/api/v1/weather/forecast?city=Chapadão do Sul"

# Produção
curl "https://apibotagro.onrender.com/api/v1/weather/current?city=São Paulo"
```

### 🖼️ Clima - Geração de Imagens

#### Gerar imagem de previsão

```http
GET /api/v1/clima/generate?city=São Paulo&layer=temp&hours=24
```

**Parâmetros:**
- `city` (obrigatório): Nome da cidade
- `layer` (opcional): Camada (satellite, clouds, radar, temp, wind, rain, thunder, rainthunder) - padrão: temp
- `hours` (opcional): Horas à frente (1-168) - padrão: 24

**Exemplo de resposta:**
```json
{
  "success": true,
  "city": "São Paulo",
  "layer": "temp",
  "hours": 24,
  "imagePath": "/path/to/saopaulo_windy_temp_24h.png",
  "imageUrl": "/api/clima/image/temp/saopaulo_windy_temp_24h.png",
  "timestamp": "2024-11-19T10:00:00.000Z"
}
```

#### Listar imagens disponíveis

```http
GET /api/v1/clima/images?city=São Paulo
```

**Parâmetros:**
- `city` (obrigatório): Nome da cidade

**Exemplo de uso:**
```bash
# Local
curl "http://localhost:3000/api/v1/clima/generate?city=São Paulo&layer=rain&hours=48"

# Produção
curl "https://apibotagro.onrender.com/api/v1/clima/images?city=São Paulo"
```

## 🔧 Módulos Disponíveis

### 🌾 USDA - Commodities Agrícolas

Fornece dados de commodities agrícolas através da API USDA PSD (Production, Supply and Distribution).

**Arquivos:**
- `config.js` - Configuração da API (chave, URL base)
- `psdService.js` - Serviço para comunicação com a API USDA
- `commodityHandler.js` - Handler que detecta intenções e processa mensagens do bot
- `commodityController.js` - Controller para APIs independentes

**Commodities Suportadas:**
- Milho (código: 0440000)
- Soja (código: 2222000)
- Trigo (código: 0410000)
- Café (código: 0411100)
- Algodão (código: 0422000)
- Açúcar (código: 0416000)
- Arroz (código: 0443000)

**Dados Fornecidos:**
- Produção
- Exportação
- Importação
- Estoque Final
- Área Plantada
- Consumo Doméstico
- Oferta Total
- Uso Total

### 🌤️ OpenWeather - Previsão do Tempo

Fornece previsão do tempo para qualquer cidade usando a API OpenWeather Map.

**Arquivos:**
- `config.js` - Configuração da API (chave, URL base)
- `weatherService.js` - Serviço para comunicação com a API OpenWeather
- `weatherHandler.js` - Handler que detecta intenções e processa mensagens do bot
- `weatherController.js` - Controller para APIs independentes

**Funcionalidades:**
- Previsão do tempo para 5 dias (intervalos de 3 horas)
- Clima atual
- Dados de temperatura, umidade, vento, chuva
- Suporte para imagens de previsão (quando disponíveis)

### 🗺️ Clima - Geração de Imagens

Gera imagens de previsão do tempo usando a API Windy e Puppeteer.

**Arquivos:**
- `config.js` - Configuração da API Windy
- `forecastEMCWF.mjs` - Script para gerar imagens de previsão
- `climaController.js` - Controller para APIs independentes

**Camadas Disponíveis:**
- `rain` - Chuva
- `temp` - Temperatura
- `wind` - Vento
- `clouds` - Nuvens
- `radar` - Radar
- `satellite` - Satélite
- `thunder` - Trovões
- `rainthunder` - Chuva e trovões

**Estrutura de Pastas:**
```
clima/
├── imgrain/      # Imagens de chuva
├── imgtemp/      # Imagens de temperatura
├── imgwind/      # Imagens de vento
├── imgcloud/     # Imagens de nuvens
├── imgradar/     # Imagens de radar
├── imgsat/       # Imagens de satélite
├── imgthund/     # Imagens de trovões
└── imgrt/        # Imagens de chuva e trovões
```

**Uso via linha de comando:**
```bash
node forecastEMCWF.mjs [horas] [camada] [cidade]
# Exemplo:
node forecastEMCWF.mjs 24 rain "São Paulo"
```

### 📍 Geolocalização - Processamento de Propriedades

Processa arquivos geográficos (.shp e .kml) enviados pelos usuários e extrai informações sobre propriedades rurais.

**Arquivos:**
- `config.js` - Configuração do módulo (diretórios, limites de arquivo)
- `propertyService.js` - Serviço para processar arquivos geográficos
- `propertyHandler.js` - Handler para formatar dados de propriedades

**Funcionalidades:**
- Upload e processamento de arquivos Shapefile (.shp)
- Upload e processamento de arquivos KML (.kml)
- Cálculo automático de área em hectares e km²
- Extração de coordenadas e centroides
- Suporte a múltiplos polígonos
- Geração de GeoJSON para uso futuro
- Cálculo de bounding box (limites da propriedade)

**Formatos Suportados:**
- `.shp` - Shapefile (requer arquivos auxiliares .shx e .dbf no mesmo diretório)
- `.kml` - Keyhole Markup Language
- `.kmz` - KML comprimido

**Dados Extraídos:**
- Área total da propriedade (m², hectares, km²)
- Número de polígonos
- Coordenadas do centroide (centro da propriedade)
- Bounding box (limites geográficos)
- GeoJSON completo para análises futuras

**Uso Futuro:**
Este módulo será usado para criar traçados de propriedades e medir o clima especificamente sobre a área da fazenda do usuário.

### 🛠️ Utils - Utilitários

Utilitários compartilhados entre os módulos.

**Arquivos:**
- `textNormalizer.js` - Normalização de texto usando IA (OpenAI)

**Funcionalidades:**
- Correção de acentos em nomes de cidades
- Correção de erros de digitação em nomes de commodities
- Normalização geral de texto

## 🌐 API REST

Todos os módulos estão disponíveis através de rotas HTTP REST. A documentação completa está disponível via Swagger.

### 🚀 Servidor em Produção

O servidor está hospedado no **Render** e está disponível em:

**URL Base:** `https://apibotagro.onrender.com`

**Documentação Swagger:** [https://apibotagro.onrender.com/api-docs](https://apibotagro.onrender.com/api-docs)

**Health Check:** [https://apibotagro.onrender.com/health](https://apibotagro.onrender.com/health)

### Endpoints Disponíveis

#### APIs Independentes (v1)

- `GET /api/v1/usda/commodity?name={nome}&year={ano}&country={pais}` - Busca dados de commodity por nome
- `GET /api/v1/weather/forecast?city={cidade}` - Previsão para 5 dias
- `GET /api/v1/weather/current?city={cidade}` - Clima atual
- `GET /api/v1/clima/generate?city={cidade}&layer={camada}&hours={horas}` - Gera imagem de previsão
- `GET /api/v1/clima/images?city={cidade}` - Lista imagens disponíveis

#### USDA (Commodities) - Endpoints Legados

- `GET /api/usda/commodities` - Lista todas as commodities
- `GET /api/usda/commodity/:code/country/:country/year/:year` - Dados por país e ano
- `GET /api/usda/commodity/:code/brazil/:year` - Dados do Brasil
- `GET /api/usda/commodity/:code/world/:year` - Dados globais
- `GET /api/usda/commodity/:code/data-release` - Datas de atualização
- `GET /api/usda/regions` - Lista de regiões
- `GET /api/usda/countries` - Lista de países

#### OpenWeather (Clima) - Endpoints Legados

- `GET /api/weather/forecast/:city` - Previsão para 5 dias
- `GET /api/weather/current/:city` - Clima atual

#### Clima (Imagens) - Endpoints Legados

- `GET /api/clima/images/:city/:layer` - Verifica se existe imagem
- `GET /api/clima/images/:city/:layer/file` - Retorna arquivo de imagem

#### Geolocalização (Propriedades)

- `POST /api/geolocalizacao/upload` - Faz upload e processa arquivo .shp ou .kml
- `GET /api/geolocalizacao/info` - Informações sobre o módulo

#### Health

- `GET /health` - Status do servidor

### Exemplos de Uso

#### Produção (Render)

```bash
# Health Check
curl https://apibotagro.onrender.com/health

# Buscar dados de milho (API Independente)
curl "https://apibotagro.onrender.com/api/v1/usda/commodity?name=milho"

# Previsão do tempo para São Paulo (API Independente)
curl "https://apibotagro.onrender.com/api/v1/weather/forecast?city=São Paulo"

# Buscar dados de milho do Brasil em 2025 (Legado)
curl https://apibotagro.onrender.com/api/usda/commodity/0440000/brazil/2025

# Upload e processamento de arquivo KML
curl -X POST https://apibotagro.onrender.com/api/geolocalizacao/upload \
  -F "file=@propriedade.kml"
```

#### Desenvolvimento Local

```bash
# Buscar dados de milho (API Independente)
curl "http://localhost:3000/api/v1/usda/commodity?name=milho&year=2024"

# Previsão do tempo para São Paulo (API Independente)
curl "http://localhost:3000/api/v1/weather/forecast?city=São Paulo"

# Buscar dados de milho do Brasil em 2025 (Legado)
curl http://localhost:3000/api/usda/commodity/0440000/brazil/2025
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie o arquivo `API/.env` com as seguintes variáveis:

```env
# USDA PSD API
USDA_PSD_API_KEY=sua_chave_usda_aqui
USDA_PSD_BASE_URL=https://api.fas.usda.gov

# Windy API (para geração de imagens)
WINDY_API_KEY=sua_chave_windy_aqui
```

**Nota:** A chave da OpenWeather deve estar no `.env` da raiz do projeto:

```env
OPENWEATHER_API_KEY=sua_chave_openweather_aqui
```

### Como Obter as Chaves

1. **USDA PSD API:**
   - Registre-se em: https://apps.fas.usda.gov/psdonline/app/index.html#/app/home
   - Obtenha sua chave de API

2. **OpenWeather:**
   - Crie uma conta em: https://openweathermap.org/api
   - Gere uma chave de API gratuita

3. **Windy:**
   - Acesse: https://www.windy.com/
   - Obtenha sua chave de API

## 📚 Documentação Swagger

A documentação completa da API está disponível via Swagger UI e também em arquivos OpenAPI na pasta `API/`:

- **`swagger.yaml`** - Especificação OpenAPI em formato YAML
- **`swagger.json`** - Especificação OpenAPI em formato JSON

Esses arquivos podem ser importados em ferramentas como:
- Swagger Editor (https://editor.swagger.io/)
- Postman (importar OpenAPI)
- Insomnia (importar OpenAPI)
- Outras ferramentas que suportam OpenAPI 3.0

### 📄 Arquivos Swagger

Os arquivos de especificação Swagger estão localizados em:
- `API/swagger.yaml`
- `API/swagger.json`

### 🌐 Swagger UI Online

### 🌐 Produção (Render)

**URL:** [https://apibotagro.onrender.com/api-docs](https://apibotagro.onrender.com/api-docs)

Acesse diretamente no navegador para explorar e testar todos os endpoints disponíveis.

### 💻 Desenvolvimento Local

**URL:** `http://localhost:3000/api-docs`

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Acesse no navegador:
   ```
   http://localhost:3000/api-docs
   ```

### 📋 O que você encontra no Swagger

- Descrição de todos os endpoints
- Parâmetros necessários
- Exemplos de requisições e respostas
- Códigos de status HTTP
- Schemas de dados
- Teste interativo dos endpoints

## 🔄 Integração com o Bot

Os módulos são automaticamente integrados ao bot do WhatsApp:

1. **Detecção de Intenção:** O bot detecta automaticamente quando o usuário pergunta sobre commodities ou clima
2. **Processamento:** Os handlers processam a mensagem e extraem informações relevantes
3. **Busca de Dados:** Os serviços fazem chamadas às APIs externas ou usam os controllers independentes
4. **Formatação:** Os dados são formatados de forma amigável para o usuário
5. **Resposta:** O bot envia a resposta formatada via WhatsApp

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se as chaves de API estão corretas no arquivo `.env`
- Confirme se as chaves não expiraram

### Erro 404 (Not Found)
- Verifique se os códigos de commodity ou nomes de cidade estão corretos
- Alguns dados podem não estar disponíveis para todos os anos

### Imagens não encontradas
- Execute o script `forecastEMCWF.mjs` para gerar as imagens
- Verifique se o nome da cidade está normalizado (sem espaços, acentos)

## 📝 Notas

- As APIs externas podem ter limites de requisições
- Alguns dados podem não estar disponíveis para todos os anos
- As imagens de previsão precisam ser geradas manualmente usando o script
- A normalização de texto usa a API OpenAI (requer créditos)
- **As APIs v1 são totalmente independentes** e podem ser usadas sem o bot WhatsApp

## 🔗 Links Úteis

### APIs Externas
- [Documentação USDA PSD API](https://apps.fas.usda.gov/psdonline/app/index.html#/app/help)
- [Documentação OpenWeather API](https://openweathermap.org/api)
- [Documentação Windy API](https://www.windy.com/)

### Documentação e Ferramentas
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Render Dashboard](https://dashboard.render.com)
- [Documentação Render](https://render.com/docs)

### APIs em Produção
- **Health Check:** https://apibotagro.onrender.com/health
- **Swagger UI:** https://apibotagro.onrender.com/api-docs
- **Repositório GitHub:** https://github.com/GlenFerreira/BOTAgro
