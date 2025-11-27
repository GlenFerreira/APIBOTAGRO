import psdService from './psdService.js';
import { normalizarTextoComIA } from '../utils/textNormalizer.js';

// Mapeamento de nomes de commodities para códigos da API USDA
const COMMODITY_MAP = {
    'milho': '0440000',
    'soja': '2222000',
    'soja_grain': '2222000',
    'soja_meal': '0813100',
    'trigo': '0410000',
    'cafe': '0411100',
    'café': '0411100',
    'algodao': '0422000',
    'algodão': '0422000',
    'acucar': '0416000',
    'açúcar': '0416000',
    'arroz': '0443000',
};

// Mapeamento de attributeId para nomes de campos
const ATTRIBUTE_MAP = {
    4: 'production',
    20: 'exports',
    28: 'endingStocks',
    57: 'areaPlanted',
    86: 'domesticConsumption',
    88: 'imports',
    125: 'crush',
    176: 'totalSupply',
    178: 'totalUse',
};

/**
 * Processa o array de dados da API USDA e extrai os valores por attributeId
 */
function processarDadosArray(dataArray) {
    const dados = {};
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return dados;
    }
    
    dataArray.forEach(item => {
        const attributeId = item.attributeId;
        const fieldName = ATTRIBUTE_MAP[attributeId];
        
        if (fieldName && item.value !== undefined && item.value !== null) {
            dados[fieldName] = item.value;
        }
    });
    
    return dados;
}

/**
 * Formata números grandes
 */
function formatNumber(num) {
    if (!num) return null;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }).format(num);
}

/**
 * API Independente: Busca dados de commodity por nome
 * @param {string} commodityName - Nome da commodity (ex: "milho", "soja")
 * @param {number} year - Ano (opcional, padrão: ano atual)
 * @param {string} countryCode - Código do país (opcional, padrão: "BR")
 * @returns {Promise<Object>} Dados formatados da commodity
 */
export async function getCommodityDataByName(commodityName, year = null, countryCode = 'BR') {
    try {
        // Normaliza o nome da commodity
        const normalizedName = await normalizarTextoComIA(commodityName, 'commodity');
        const nameLower = normalizedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Busca o código da commodity
        let commodityCode = null;
        let alternativeCode = null;
        
        if (nameLower.includes('soja') || nameLower.includes('sojx')) {
            commodityCode = COMMODITY_MAP.soja;
            alternativeCode = COMMODITY_MAP.soja_meal;
        } else {
            for (const [name, code] of Object.entries(COMMODITY_MAP)) {
                if (name.includes('_')) continue;
                const nameLowerMap = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (nameLower.includes(nameLowerMap) || nameLowerMap.includes(nameLower)) {
                    commodityCode = code;
                    break;
                }
            }
        }
        
        if (!commodityCode) {
            throw new Error(`Commodity "${commodityName}" não encontrada. Commodities disponíveis: ${Object.keys(COMMODITY_MAP).filter(k => !k.includes('_')).join(', ')}`);
        }
        
        // Define o ano (padrão: ano atual)
        const anoAtual = new Date().getFullYear();
        const anoParaBuscar = year || anoAtual;
        
        // Tenta buscar dados
        let dados = null;
        const anosParaTestar = [anoParaBuscar, anoParaBuscar - 1, anoParaBuscar - 2];
        const codigosParaTestar = alternativeCode ? [commodityCode, alternativeCode] : [commodityCode];
        
        // Tenta dados do país especificado
        for (const codigo of codigosParaTestar) {
            for (const ano of anosParaTestar) {
                try {
                    if (countryCode === 'BR') {
                        dados = await psdService.getBrazilCommodityData(codigo, ano);
                    } else {
                        dados = await psdService.getCommodityData(codigo, countryCode, ano);
                    }
                    
                    if (dados && Array.isArray(dados) && dados.length > 0) {
                        commodityCode = codigo;
                        break;
                    } else if (dados && !Array.isArray(dados) && Object.keys(dados).length > 0) {
                        commodityCode = codigo;
                        break;
                    } else {
                        dados = null;
                    }
                } catch (error) {
                    dados = null;
                }
            }
            if (dados && ((Array.isArray(dados) && dados.length > 0) || (!Array.isArray(dados) && Object.keys(dados).length > 0))) {
                break;
            }
        }
        
        // Se não encontrou dados do país, tenta dados globais
        if (!dados || (Array.isArray(dados) && dados.length === 0)) {
            for (const ano of anosParaTestar) {
                try {
                    dados = await psdService.getWorldCommodityData(commodityCode, ano);
                    
                    if (dados && Array.isArray(dados) && dados.length > 0) {
                        countryCode = 'WORLD';
                        break;
                    } else if (dados && !Array.isArray(dados) && Object.keys(dados).length > 0) {
                        countryCode = 'WORLD';
                        break;
                    } else {
                        dados = null;
                    }
                } catch (error) {
                    dados = null;
                }
            }
        }
        
        // Se ainda não encontrou dados, retorna erro
        if (!dados || (Array.isArray(dados) && dados.length === 0) || (typeof dados === 'object' && Object.keys(dados).length === 0)) {
            throw new Error(`Não foi possível encontrar dados atualizados para ${normalizedName} no ano ${anoParaBuscar}.`);
        }
        
        // Processa os dados
        let dadosProcessados = {};
        let ano = anoParaBuscar;
        
        if (Array.isArray(dados) && dados.length > 0) {
            dadosProcessados = processarDadosArray(dados);
            if (dados[0].marketYear) {
                ano = dados[0].marketYear;
            }
        } else if (dados && typeof dados === 'object') {
            dadosProcessados = dados;
            ano = dados.marketYear || dados.year || anoParaBuscar;
        }
        
        // Retorna dados estruturados
        return {
            success: true,
            commodity: {
                name: normalizedName,
                code: commodityCode,
                country: countryCode,
                year: ano
            },
            data: {
                production: dadosProcessados.production ? {
                    value: dadosProcessados.production,
                    formatted: formatNumber(dadosProcessados.production) + ' mil toneladas'
                } : null,
                exports: dadosProcessados.exports ? {
                    value: dadosProcessados.exports,
                    formatted: formatNumber(dadosProcessados.exports) + ' mil toneladas'
                } : null,
                endingStocks: dadosProcessados.endingStocks ? {
                    value: dadosProcessados.endingStocks,
                    formatted: formatNumber(dadosProcessados.endingStocks) + ' mil toneladas'
                } : null,
                areaPlanted: dadosProcessados.areaPlanted ? {
                    value: dadosProcessados.areaPlanted,
                    formatted: formatNumber(dadosProcessados.areaPlanted) + ' mil hectares'
                } : null,
                domesticConsumption: dadosProcessados.domesticConsumption ? {
                    value: dadosProcessados.domesticConsumption,
                    formatted: formatNumber(dadosProcessados.domesticConsumption) + ' mil toneladas'
                } : null,
                imports: dadosProcessados.imports ? {
                    value: dadosProcessados.imports,
                    formatted: formatNumber(dadosProcessados.imports) + ' mil toneladas'
                } : null,
                crush: dadosProcessados.crush ? {
                    value: dadosProcessados.crush,
                    formatted: formatNumber(dadosProcessados.crush) + ' mil toneladas'
                } : null,
                totalSupply: dadosProcessados.totalSupply ? {
                    value: dadosProcessados.totalSupply,
                    formatted: formatNumber(dadosProcessados.totalSupply) + ' mil toneladas'
                } : null,
                totalUse: dadosProcessados.totalUse ? {
                    value: dadosProcessados.totalUse,
                    formatted: formatNumber(dadosProcessados.totalUse) + ' mil toneladas'
                } : null
            },
            raw: dados,
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

/**
 * API Independente: Busca dados de commodity por código
 * @param {string} commodityCode - Código da commodity (ex: "0440000")
 * @param {number} year - Ano
 * @param {string} countryCode - Código do país (opcional, padrão: "BR")
 * @returns {Promise<Object>} Dados da commodity
 */
export async function getCommodityDataByCode(commodityCode, year, countryCode = 'BR') {
    try {
        let dados = null;
        
        if (countryCode === 'BR') {
            dados = await psdService.getBrazilCommodityData(commodityCode, year);
        } else if (countryCode === 'WORLD') {
            dados = await psdService.getWorldCommodityData(commodityCode, year);
        } else {
            dados = await psdService.getCommodityData(commodityCode, countryCode, year);
        }
        
        return {
            success: true,
            commodity: {
                code: commodityCode,
                country: countryCode,
                year: year
            },
            data: dados,
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

