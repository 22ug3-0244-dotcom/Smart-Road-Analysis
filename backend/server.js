const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./road_data.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to RDA Road Database.');
});

// Table matches your 'Classification' and 'GIS Mapping' outcomes
db.run(`CREATE TABLE IF NOT EXISTS cracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    severity TEXT,
    lat REAL,
    lng REAL
)`);

app.get('/api/cracks', (req, res) => {
    db.all("SELECT * FROM cracks", [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

app.post('/api/cracks', (req, res) => {
    const { type, severity, lat, lng } = req.body;
    db.run(`INSERT INTO cracks (type, severity, lat, lng) VALUES (?, ?, ?, ?)`, 
    [type, severity, lat, lng], function(err) {
        if (err) return res.status(500).send(err);
        res.json({ id: this.lastID });
    });
});

app.put('/api/cracks/:id', (req, res) => {
    const { lat, lng } = req.body;
    db.run(`UPDATE cracks SET lat = ?, lng = ? WHERE id = ?`, [lat, lng, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated" });
    });
});

app.delete('/api/cracks/:id', (req, res) => {
    db.run(`DELETE FROM cracks WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Repaired" });
    });
});

app.listen(5000, () => console.log('Backend Services running on port 5000'));