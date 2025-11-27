import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as shapefile from 'shapefile';
import toGeoJSON from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Processa um arquivo KML e retorna dados da propriedade
 * @param {string} filePath - Caminho do arquivo KML
 * @returns {Promise<Object>} Dados da propriedade
 */
async function processKMLFile(filePath) {
    try {
        const kmlContent = fs.readFileSync(filePath, 'utf-8');
        const kml = new DOMParser().parseFromString(kmlContent);
        const geoJson = toGeoJSON.kml(kml);

        if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
            throw new Error('Nenhuma geometria encontrada no arquivo KML');
        }

        // Processa todas as features (pode haver múltiplos polígonos)
        const features = geoJson.features.filter(f => 
            f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        );

        if (features.length === 0) {
            throw new Error('Nenhum polígono encontrado no arquivo KML');
        }

        // Calcula área total e informações de cada polígono
        let totalArea = 0;
        const polygons = [];

        for (const feature of features) {
            const area = turf.area(feature); // Área em metros quadrados
            const areaHectares = area / 10000; // Converte para hectares
            totalArea += area;

            // Calcula o centroide (centro da propriedade)
            const centroid = turf.centroid(feature);
            
            // Calcula o bounding box
            const bbox = turf.bbox(feature);

            polygons.push({
                area: area,
                areaHectares: parseFloat(areaHectares.toFixed(4)),
                areaKm2: parseFloat((area / 1000000).toFixed(6)),
                centroid: {
                    longitude: parseFloat(centroid.geometry.coordinates[0].toFixed(6)),
                    latitude: parseFloat(centroid.geometry.coordinates[1].toFixed(6))
                },
                bbox: {
                    minLon: parseFloat(bbox[0].toFixed(6)),
                    minLat: parseFloat(bbox[1].toFixed(6)),
                    maxLon: parseFloat(bbox[2].toFixed(6)),
                    maxLat: parseFloat(bbox[3].toFixed(6))
                },
                geometry: feature.geometry
            });
        }

        return {
            type: 'kml',
            totalArea: totalArea,
            totalAreaHectares: parseFloat((totalArea / 10000).toFixed(4)),
            totalAreaKm2: parseFloat((totalArea / 1000000).toFixed(6)),
            polygonCount: polygons.length,
            polygons: polygons,
            geoJson: geoJson
        };
    } catch (error) {
        throw new Error(`Erro ao processar arquivo KML: ${error.message}`);
    }
}

/**
 * Processa um arquivo Shapefile e retorna dados da propriedade
 * @param {string} shpPath - Caminho do arquivo .shp
 * @param {string} uploadDir - Diretório onde estão os arquivos auxiliares
 * @returns {Promise<Object>} Dados da propriedade
 */
async function processShapefile(shpPath, uploadDir) {
    try {
        // Verifica se o arquivo existe
        if (!fs.existsSync(shpPath)) {
            throw new Error(`Arquivo .shp não encontrado: ${shpPath}`);
        }

        // Tenta encontrar arquivos auxiliares no mesmo diretório
        const basePath = shpPath.replace(/\.shp$/i, '');
        const shxPath = basePath + '.shx';
        const dbfPath = basePath + '.dbf';
        
        // Lê o shapefile (a biblioteca shapefile tenta encontrar os arquivos auxiliares automaticamente)
        const source = await shapefile.open(shpPath);
        const features = [];

        // Processa todas as features
        let result = await source.read();
        while (!result.done) {
            if (result.value) {
                features.push(result.value);
            }
            result = await source.read();
        }

        if (features.length === 0) {
            throw new Error('Nenhuma geometria encontrada no arquivo Shapefile');
        }

        // Filtra apenas polígonos
        const polygons = features.filter(f => 
            f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        );

        if (polygons.length === 0) {
            throw new Error('Nenhum polígono encontrado no arquivo Shapefile');
        }

        // Calcula área total e informações de cada polígono
        let totalArea = 0;
        const polygonData = [];

        for (const feature of polygons) {
            // Converte para GeoJSON Feature
            const geoJsonFeature = {
                type: 'Feature',
                geometry: feature.geometry,
                properties: feature.properties || {}
            };

            const area = turf.area(geoJsonFeature); // Área em metros quadrados
            const areaHectares = area / 10000; // Converte para hectares
            totalArea += area;

            // Calcula o centroide
            const centroid = turf.centroid(geoJsonFeature);
            
            // Calcula o bounding box
            const bbox = turf.bbox(geoJsonFeature);

            polygonData.push({
                area: area,
                areaHectares: parseFloat(areaHectares.toFixed(4)),
                areaKm2: parseFloat((area / 1000000).toFixed(6)),
                centroid: {
                    longitude: parseFloat(centroid.geometry.coordinates[0].toFixed(6)),
                    latitude: parseFloat(centroid.geometry.coordinates[1].toFixed(6))
                },
                bbox: {
                    minLon: parseFloat(bbox[0].toFixed(6)),
                    minLat: parseFloat(bbox[1].toFixed(6)),
                    maxLon: parseFloat(bbox[2].toFixed(6)),
                    maxLat: parseFloat(bbox[3].toFixed(6))
                },
                properties: feature.properties || {},
                geometry: feature.geometry
            });
        }

        return {
            type: 'shapefile',
            totalArea: totalArea,
            totalAreaHectares: parseFloat((totalArea / 10000).toFixed(4)),
            totalAreaKm2: parseFloat((totalArea / 1000000).toFixed(6)),
            polygonCount: polygonData.length,
            polygons: polygonData,
            geoJson: {
                type: 'FeatureCollection',
                features: polygons.map(f => ({
                    type: 'Feature',
                    geometry: f.geometry,
                    properties: f.properties || {}
                }))
            }
        };
    } catch (error) {
        throw new Error(`Erro ao processar arquivo Shapefile: ${error.message}`);
    }
}

/**
 * Processa um arquivo geográfico (.shp ou .kml)
 * @param {string} filePath - Caminho do arquivo
 * @param {string} originalName - Nome original do arquivo
 * @param {string} uploadDir - Diretório de upload
 * @returns {Promise<Object>} Dados da propriedade processada
 */
async function processPropertyFile(filePath, originalName, uploadDir) {
    const ext = path.extname(originalName).toLowerCase();

    if (ext === '.kml' || ext === '.kmz') {
        return await processKMLFile(filePath);
    } else if (ext === '.shp') {
        return await processShapefile(filePath, uploadDir);
    } else {
        throw new Error(`Formato de arquivo não suportado: ${ext}`);
    }
}

export default {
    processKMLFile,
    processShapefile,
    processPropertyFile
};

