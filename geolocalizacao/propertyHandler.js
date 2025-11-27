import propertyService from './propertyService.js';

/**
 * Processa um arquivo de propriedade e retorna informações formatadas
 * @param {string} filePath - Caminho do arquivo
 * @param {string} originalName - Nome original do arquivo
 * @param {string} uploadDir - Diretório de upload
 * @returns {Promise<string>} Mensagem formatada com informações da propriedade
 */
export async function processPropertyFile(filePath, originalName, uploadDir) {
    try {
        const data = await propertyService.processPropertyFile(filePath, originalName, uploadDir);

        // Formata a mensagem de resposta
        let message = `📍 *Informações da Propriedade*\n\n`;
        message += `📁 *Arquivo:* ${originalName}\n`;
        message += `📊 *Tipo:* ${data.type.toUpperCase()}\n`;
        message += `🔢 *Polígonos:* ${data.polygonCount}\n\n`;
        
        message += `📐 *Área Total:*\n`;
        message += `   • ${data.totalAreaHectares.toLocaleString('pt-BR')} hectares\n`;
        message += `   • ${data.totalAreaKm2.toLocaleString('pt-BR')} km²\n`;
        message += `   • ${(data.totalArea / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha\n\n`;

        if (data.polygons && data.polygons.length > 0) {
            message += `📍 *Centro da Propriedade:*\n`;
            message += `   • Latitude: ${data.polygons[0].centroid.latitude}\n`;
            message += `   • Longitude: ${data.polygons[0].centroid.longitude}\n\n`;

            if (data.polygonCount > 1) {
                message += `📋 *Detalhes por Polígono:*\n`;
                data.polygons.forEach((poly, index) => {
                    message += `\n   *Polígono ${index + 1}:*\n`;
                    message += `   • Área: ${poly.areaHectares.toLocaleString('pt-BR')} ha\n`;
                    message += `   • Centro: ${poly.centroid.latitude}, ${poly.centroid.longitude}\n`;
                });
            }
        }

        message += `\n✅ Arquivo processado com sucesso!`;
        message += `\n\n💡 *Próximos passos:*`;
        message += `\n   • Esta área será usada para análises climáticas futuras`;
        message += `\n   • Os dados da propriedade foram salvos`;

        return {
            success: true,
            message: message,
            data: data
        };
    } catch (error) {
        return {
            success: false,
            message: `❌ Erro ao processar arquivo: ${error.message}`,
            error: error.message
        };
    }
}

/**
 * Formata dados da propriedade para resposta JSON
 * @param {Object} data - Dados da propriedade
 * @returns {Object} Dados formatados
 */
export function formatPropertyData(data) {
    return {
        type: data.type,
        fileName: data.fileName || 'unknown',
        totalArea: {
            squareMeters: data.totalArea,
            hectares: data.totalAreaHectares,
            squareKilometers: data.totalAreaKm2
        },
        polygonCount: data.polygonCount,
        polygons: data.polygons.map(poly => ({
            area: {
                squareMeters: poly.area,
                hectares: poly.areaHectares,
                squareKilometers: poly.areaKm2
            },
            centroid: poly.centroid,
            bbox: poly.bbox,
            properties: poly.properties || {}
        })),
        geoJson: data.geoJson
    };
}


