// Carrega variáveis de ambiente do arquivo .env na pasta API
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o .env da pasta API
dotenv.config({ path: path.join(__dirname, '../.env') });

export default {
    // Diretório para armazenar arquivos temporários
    UPLOAD_DIR: path.join(__dirname, '../../uploads'),
    // Tamanho máximo do arquivo (50MB)
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    // Tipos de arquivo permitidos
    ALLOWED_FILE_TYPES: ['.shp', '.kml', '.kmz'],
    // Extensões auxiliares do shapefile
    SHAPEFILE_EXTENSIONS: ['.shp', '.shx', '.dbf', '.prj']
};


