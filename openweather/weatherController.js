import weatherService from './weatherService.js';
import { normalizarTextoComIA } from '../utils/textNormalizer.js';

// Mapeamento de ícones do OpenWeather para emojis
const WEATHER_ICONS = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️'
};

/**
 * Verifica se existe imagem para a cidade no Supabase
 */
function getCityImagePath(cityName) {
    const normalizedName = cityName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    
    // URLs fixas do Supabase para as cidades disponíveis
    const SUPABASE_BASE_URL = 'https://sqsgconmsaeabsdjsyqq.supabase.co/storage/v1/object/public/agroimg';
    
    // Mapeamento de cidades normalizadas para URLs
    const cityImageMap = {
        'saopaulo': `${SUPABASE_BASE_URL}/saopaulo_windy_rain_24h.png`,
        'chapadaodosul': `${SUPABASE_BASE_URL}/chapadaodosul_windy_rain_24h.png`
    };
    
    // Retorna a URL se a cidade estiver no mapeamento, caso contrário retorna null
    return cityImageMap[normalizedName] || null;
}

/**
 * API Independente: Busca previsão do tempo para 5 dias
 * @param {string} cityName - Nome da cidade
 * @returns {Promise<Object>} Dados da previsão do tempo
 */
export async function getWeatherForecast(cityName) {
    try {
        // Normaliza o nome da cidade
        const normalizedCityName = await normalizarTextoComIA(cityName, 'cidade');
        
        // Busca dados da API
        const data = await weatherService.get5DayForecast(normalizedCityName);
        
        // Verifica se existe imagem
        let imagePath = getCityImagePath(normalizedCityName);
        if (!imagePath) {
            imagePath = getCityImagePath(data.city.name);
        }
        
        // Processa previsões diárias
        const dailyForecasts = {};
        
        data.forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const hour = date.getHours();
            
            if (!dailyForecasts[dateKey] || hour === 12 || (hour >= 9 && hour <= 15)) {
                dailyForecasts[dateKey] = item;
            }
        });
        
        // Ordena por data
        const sortedDates = Object.keys(dailyForecasts).sort((a, b) => {
            const [dayA, monthA] = a.split('/');
            const [dayB, monthB] = b.split('/');
            return new Date(2024, monthA - 1, dayA) - new Date(2024, monthB - 1, dayB);
        });
        
        // Formata previsões
        const forecasts = sortedDates.slice(0, 5).map(dateKey => {
            const item = dailyForecasts[dateKey];
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dayNumber = date.getDate();
            const month = date.toLocaleDateString('pt-BR', { month: 'long' });
            
            return {
                date: date.toISOString(),
                dateFormatted: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNumber} de ${month}`,
                icon: WEATHER_ICONS[item.weather[0].icon] || '🌤️',
                description: item.weather[0].description,
                temperature: {
                    current: Math.round(item.main.temp),
                    min: Math.round(item.main.temp_min),
                    max: Math.round(item.main.temp_max)
                },
                humidity: item.main.humidity,
                windSpeed: Math.round(item.wind.speed * 3.6), // km/h
                rain: item.rain ? (item.rain['3h'] || 0) : 0
            };
        });
        
        return {
            success: true,
            city: {
                name: data.city.name,
                country: data.city.country,
                state: data.city.state,
                coordinates: {
                    lat: data.city.lat,
                    lon: data.city.lon
                }
            },
            forecasts: forecasts,
            hasImage: imagePath !== null,
            imagePath: imagePath,
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
 * API Independente: Busca clima atual
 * @param {string} cityName - Nome da cidade
 * @returns {Promise<Object>} Dados do clima atual
 */
export async function getCurrentWeather(cityName) {
    try {
        // Normaliza o nome da cidade
        const normalizedCityName = await normalizarTextoComIA(cityName, 'cidade');
        
        // Busca dados da API
        const data = await weatherService.getCurrentWeather(normalizedCityName);
        
        return {
            success: true,
            city: {
                name: data.city.name,
                country: data.city.country,
                state: data.city.state,
                coordinates: {
                    lat: data.city.lat,
                    lon: data.city.lon
                }
            },
            weather: {
                icon: WEATHER_ICONS[data.weather.weather[0].icon] || '🌤️',
                description: data.weather.weather[0].description,
                temperature: {
                    current: Math.round(data.weather.main.temp),
                    feelsLike: Math.round(data.weather.main.feels_like),
                    min: Math.round(data.weather.main.temp_min),
                    max: Math.round(data.weather.main.temp_max)
                },
                humidity: data.weather.main.humidity,
                pressure: data.weather.main.pressure,
                windSpeed: Math.round(data.weather.wind.speed * 3.6), // km/h
                windDirection: data.weather.wind.deg || null,
                visibility: data.weather.visibility ? (data.weather.visibility / 1000) : null, // km
                clouds: data.weather.clouds?.all || 0
            },
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

