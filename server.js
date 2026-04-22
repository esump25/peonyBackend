const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Install with: npm install node-fetch@2
const app = express();

app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.get('/find-place', async (req, res) => {
    const { query, lat, lng } = req.query;
    
    // Google Places (New) Search
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating'
            },
            body: JSON.stringify({
                textQuery: query,
                locationBias: {
                    circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 }
                }
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));