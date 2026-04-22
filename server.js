const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors()); // Allows your GitHub website to talk to this server
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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
        res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));