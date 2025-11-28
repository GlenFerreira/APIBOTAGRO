import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de camadas para pastas
const LAYER_FOLDERS = {
    'satellite': 'imgsat',
    'clouds': 'imgcloud',
    'radar': 'imgradar',
    'temp': 'imgtemp',
    'wind': 'imgwind',
    'rain': 'imgrain',
    'thunder': 'imgthund',
    'rainthunder': 'imgrt'
};

/**
 * API Independente: Gera imagem de previsão do tempo
 * @param {string} cityName - Nome da cidade
 * @param {string} layer - Camada (satellite, clouds, radar, temp, wind, rain, thunder, rainthunder)
 * @param {number} hours - Horas à frente (padrão: 24)
 * @returns {Promise<Object>} Informações sobre a imagem gerada
 */
export async function generateForecastImage(cityName, layer = 'temp', hours = 24) {
    return new Promise((resolve, reject) => {
        try {
            // Valida a camada
            if (!LAYER_FOLDERS[layer]) {
                return resolve({
                    success: false,
                    error: `Camada inválida. Camadas disponíveis: ${Object.keys(LAYER_FOLDERS).join(', ')}`
                });
            }
            
            // Valida horas
            if (hours < 1 || hours > 168) {
                return resolve({
                    success: false,
                    error: 'Horas deve estar entre 1 e 168 (7 dias)'
                });
            }
            
            // Executa o script
            const child = spawn('node', [scriptPath, hours.toString(), layer, cityName], {
                cwd: __dirname,
                stdio: 'pipe'
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                if (code !== 0) {
                    return resolve({
                        success: false,
                        error: `Erro ao gerar imagem: ${stderr || stdout}`,
                        exitCode: code
                    });
                }
                
                // Normaliza o nome da cidade para nome de arquivo
                const normalizedName = cityName
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toLowerCase();
                
                // Procura o arquivo gerado
                const folderPath = path.join(__dirname, LAYER_FOLDERS[layer]);
                const expectedFileName = `${normalizedName}_windy_${layer}_${hours}h.png`;
                const filePath = path.join(folderPath, expectedFileName);
                
                // Verifica se o arquivo existe
                if (fs.existsSync(filePath)) {
                    resolve({
                        success: true,
                        city: cityName,
                        layer: layer,
                        hours: hours,
                        imagePath: filePath,
                        imageUrl: `/api/clima/image/${layer}/${expectedFileName}`,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // Lista arquivos na pasta para debug
                    const files = fs.existsSync(folderPath) ? fs.readdirSync(folderPath) : [];
                    resolve({
                        success: false,
                        error: `Arquivo não encontrado após geração. Arquivos na pasta: ${files.join(', ')}`,
                        debug: {
                            expectedFile: expectedFileName,
                            folderPath: folderPath,
                            filesInFolder: files
                        }
                    });
                }
            });
            
            child.on('error', (error) => {
                resolve({
                    success: false,
                    error: `Erro ao executar script: ${error.message}`
                });
            });
            
        } catch (error) {
            resolve({
                success: false,
                error: error.message
            });
        }
    });
}

/**
 * API Independente: Lista imagens disponíveis para uma cidade
 * @param {string} cityName - Nome da cidade
 * @returns {Promise<Object>} Lista de imagens disponíveis
 */
export async function listCityImages(cityName) {
    try {
        const normalizedName = cityName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
        
        const images = [];
        
        // Procura em todas as pastas
        for (const [layer, folder] of Object.entries(LAYER_FOLDERS)) {
            const folderPath = path.join(__dirname, folder);
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                const cityImages = files.filter(file => 
                    file.startsWith(normalizedName) && 
                    file.endsWith('.png')
                );
                
                cityImages.forEach(file => {
                    images.push({
                        layer: layer,
                        fileName: file,
                        path: path.join(folderPath, file),
                        url: `/api/clima/image/${layer}/${file}`
                    });
                });
            }
        }
        
        return {
            success: true,
            city: cityName,
            images: images,
            count: images.length,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

