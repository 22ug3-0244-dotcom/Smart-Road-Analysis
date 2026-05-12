const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// 1. Setup the SQL Database
(async () => {
    db = await open({
        filename: './road_data.db',
        driver: sqlite3.Database
    });

    // Create the SQL table exactly as described in your presentation
    await db.exec(`
        CREATE TABLE IF NOT EXISTS cracks (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            type TEXT,
            location TEXT,
            severity TEXT,
            lat REAL,
            lng REAL
        )
    `);
    console.log("SQL Database & Table Ready.");
})();

// 2. GET data using SQL Query
app.get('/api/cracks', async (req, res) => {
    const cracks = await db.all('SELECT * FROM cracks');
    res.json(cracks);
});

// 3. INSERT data using SQL Query
app.post('/api/add-crack', async (req, res) => {
    const { type, location, severity, lat, lng } = req.body;
    await db.run(
        'INSERT INTO cracks (type, location, severity, lat, lng) VALUES (?, ?, ?, ?, ?)',
        [type, location, severity, lat, lng]
    );
    res.status(200).send("Saved to SQL Database");
});

app.listen(5000, () => console.log("Backend Server with SQL running on Port 5000"));