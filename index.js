import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Importar controllers
import { getCommodityDataByName, getCommodityDataByCode } from './USDA/commodityController.js';
import { getWeatherForecast, getCurrentWeather } from './openweather/weatherController.js';
import { generateForecastImage, listCityImages } from './clima/climaController.js';
import { processPropertyFile } from './geolocalizacao/propertyHandler.js';
import propertyService from './geolocalizacao/propertyService.js';

// Configurar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    createParentPath: true
}));

// Servir arquivos estáticos de imagens
app.use('/api/clima/image', express.static(join(__dirname, 'clima')));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Swagger UI - Servir arquivos swagger
app.get('/api-docs', (req, res) => {
    const swaggerHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
    `;
    res.send(swaggerHtml);
});

// Servir swagger.json
app.get('/swagger.json', (req, res) => {
    const swaggerPath = join(__dirname, 'swagger.json');
    if (fs.existsSync(swaggerPath)) {
        res.sendFile(swaggerPath);
    } else {
        res.status(404).json({ error: 'Swagger file not found' });
    }
});

// ==================== APIs Independentes (v1) ====================

// USDA - Commodities
app.get('/api/v1/usda/commodity', async (req, res) => {
    try {
        const { name, year, country } = req.query;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "name" é obrigatório'
            });
        }
        
        const yearNum = year ? parseInt(year) : new Date().getFullYear();
        const countryCode = country || 'BR';
        
        const result = await getCommodityDataByName(name, yearNum, countryCode);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// OpenWeather - Previsão
app.get('/api/v1/weather/forecast', async (req, res) => {
    try {
        const { city } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "city" é obrigatório'
            });
        }
        
        const result = await getWeatherForecast(city);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// OpenWeather - Clima Atual
app.get('/api/v1/weather/current', async (req, res) => {
    try {
        const { city } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "city" é obrigatório'
            });
        }
        
        const result = await getCurrentWeather(city);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Clima - Gerar Imagem
app.get('/api/v1/clima/generate', async (req, res) => {
    try {
        const { city, layer, hours } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "city" é obrigatório'
            });
        }
        
        const layerParam = layer || 'temp';
        const hoursParam = hours ? parseInt(hours) : 24;
        
        const result = await generateForecastImage(city, layerParam, hoursParam);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Clima - Listar Imagens
app.get('/api/v1/clima/images', async (req, res) => {
    try {
        const { city } = req.query;
        
        if (!city) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "city" é obrigatório'
            });
        }
        
        const result = await listCityImages(city);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==================== Endpoints Legados ====================

// USDA - Endpoints Legados
app.get('/api/usda/commodities', (req, res) => {
    res.json({
        commodities: [
            { name: 'milho', code: '0440000' },
            { name: 'soja', code: '2222000' },
            { name: 'trigo', code: '0410000' },
            { name: 'café', code: '0411100' },
            { name: 'algodão', code: '0422000' },
            { name: 'açúcar', code: '0416000' },
            { name: 'arroz', code: '0443000' }
        ]
    });
});

app.get('/api/usda/commodity/:code/country/:country/year/:year', async (req, res) => {
    try {
        const { code, country, year } = req.params;
        const yearNum = parseInt(year);
        const result = await getCommodityDataByCode(code, yearNum, country);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/usda/commodity/:code/brazil/:year', async (req, res) => {
    try {
        const { code, year } = req.params;
        const yearNum = parseInt(year);
        const result = await getCommodityDataByCode(code, yearNum, 'BR');
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/usda/commodity/:code/world/:year', async (req, res) => {
    try {
        const { code, year } = req.params;
        const yearNum = parseInt(year);
        const result = await getCommodityDataByCode(code, yearNum, 'WORLD');
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// OpenWeather - Endpoints Legados
app.get('/api/weather/forecast/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const result = await getWeatherForecast(city);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/weather/current/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const result = await getCurrentWeather(city);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Clima - Endpoints Legados
app.get('/api/clima/images/:city/:layer', (req, res) => {
    const { city, layer } = req.params;
    // Implementação simplificada - verificar se existe imagem
    res.json({
        city,
        layer,
        exists: false,
        message: 'Use /api/v1/clima/images para listar todas as imagens'
    });
});

// Geolocalização
app.post('/api/geolocalizacao/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo não enviado. Use multipart/form-data com campo "file"'
            });
        }
        
        const file = req.files.file;
        const uploadDir = join(__dirname, 'geolocalizacao', 'uploads');
        
        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = join(uploadDir, file.name);
        await file.mv(filePath);
        
        const result = await processPropertyFile(filePath, file.name, uploadDir);
        
        res.json({
            success: true,
            message: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/geolocalizacao/info', (req, res) => {
    res.json({
        name: 'Geolocalização API',
        description: 'API para processamento de arquivos geográficos (.shp, .kml)',
        supportedFormats: ['.shp', '.kml', '.kmz'],
        endpoints: {
            upload: 'POST /api/geolocalizacao/upload',
            info: 'GET /api/geolocalizacao/info'
        }
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'API AgroBOT',
        version: '1.0.0',
        description: 'API REST para dados agrícolas e meteorológicos',
        documentation: '/api-docs',
        health: '/health',
        endpoints: {
            v1: {
                usda: '/api/v1/usda/commodity',
                weather: '/api/v1/weather/forecast',
                clima: '/api/v1/clima/generate'
            }
        }
    });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Erro interno do servidor',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

export default app;

