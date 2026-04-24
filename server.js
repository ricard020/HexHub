const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// Servir archivos estaticos para cargar el frontend
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'assets', 'data', 'data.json');
const DEFAULT_DATA = { categories: [], colors: [] };

app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Si el archivo no existe, devolver la estructura base vacía
                return res.json(DEFAULT_DATA);
            }
            console.error(err);
            return res.status(500).json({ error: 'Error reading data.json' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseError) {
            console.error('Error parsing data.json', parseError);
            res.status(500).json({ error: 'Invalid JSON format in data.json' });
        }
    });
});

app.post('/api/data', (req, res) => {
    const dir = path.dirname(DATA_FILE);
    
    // Asegurar que la carpeta existe antes de escribir
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error saving data.json' });
        }
        res.json({ success: true });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
