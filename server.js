const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { Pool } = require('pg'); 
const app = express();

app.use(cors());
app.use(express.json());

// Initialize Postgres Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } 
});

// Create Table automatically
const createTable = async () => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            place_name TEXT NOT NULL,
            visit_date DATE NOT NULL,
            review_text TEXT,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            vibe_category TEXT
        );
    `;
    await pool.query(queryText);
};
createTable().catch(err => console.error("Database init error:", err));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Existing Places API Route
app.get('/find-place', async (req, res) => {
    const { query, lat, lng } = req.query;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
            },
            body: JSON.stringify({
                textQuery: query,
                locationBias: {
                    circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: 5000.0 }
                }
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// New Review Routes
app.post('/reviews', async (req, res) => {
    const { name, place, date, review, rating, vibe } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO reviews (username, place_name, visit_date, review_text, rating, vibe_category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, place, date, review, rating, vibe]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/reviews/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));