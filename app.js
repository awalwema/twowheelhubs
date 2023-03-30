const express = require('express');
const app = express();

app.set('view engine', 'ejs');
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    const fetch = (await import('node-fetch')).default;
    const stationDataUrl = 'https://gbfs.baywheels.com/gbfs/en/station_information.json';
    const response = await fetch(stationDataUrl);
    const data = await response.json();
    const stations = data.data.stations;

    res.render('index', { stations });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
