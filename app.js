const express = require('express');
const app = express();

app.set('view engine', 'ejs');
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const cache = {}; // initialize cache object

async function getCachedData(url) {
    // check if data is in cache and not older than 1 day
    if (cache[url] && Date.now() - cache[url].timestamp < 86400000) {
        console.log('Data found in cache!');
        return cache[url].data;
    }

    // if data not in cache or older than 1 day, fetch from API and store in cache
    console.log('Data not found in cache. Fetching from API...');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await handleResponse(response);

    cache[url] = { data, timestamp: Date.now() };
    console.log('Data stored in cache.');
    return data;
}


// async function handleResponse(response) {
//     if (response.ok) {
//         const data = await response.json();
//         return data;
//     } else {
//         console.warn(`Error ${response.status} while fetching bike station data.`);
//         return { data: { stations: [] } };
//     }
// }

async function handleResponse(response) {
    try {
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.warn(`Error ${response.status} while fetching bike station data.`);
            return { data: { stations: [] } };
        }
    } catch (error) {
        console.error('Error handling response:', error);
        return { data: { stations: [] } };
    }
}


app.get('/', async (req, res) => {
    const fetch = (await import('node-fetch')).default;

    const bayWheelsUrl = 'https://gbfs.baywheels.com/gbfs/en/station_information.json';
    const citiBikeUrl = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';
    const bluebikesUrl = 'https://gbfs.bluebikes.com/gbfs/en/station_information.json';
    const divvyUrl = 'https://gbfs.divvybikes.com/gbfs/en/station_information.json';
    const capitalBikeshareUrl = 'https://gbfs.capitalbikeshare.com/gbfs/en/station_information.json';
    const niceRideUrl = 'https://gbfs.niceridemn.com/gbfs/en/station_information.json';
    const houstonBcycleUrl = 'https://gbfs.bcycle.com/bcycle_houston/station_information.json';
    const madisonBikeShareUrl = "https://gbfs.bcycle.com/bcycle_madison/station_information.json";

    try {
        const [
            bayWheelsData,
            citiBikeData,
            bluebikesData,
            divvyData,
            capitalBikeshareData,
            niceRideData,
            houstonBcycleData,
            madisonBikeData,
        ] = await Promise.all([
            getCachedData(bayWheelsUrl),
            getCachedData(citiBikeUrl),
            getCachedData(bluebikesUrl),
            getCachedData(divvyUrl),
            getCachedData(capitalBikeshareUrl),
            getCachedData(niceRideUrl),
            getCachedData(houstonBcycleUrl),
            getCachedData(madisonBikeShareUrl),
        ]);


        const bayWheelsStations = bayWheelsData.data.stations;
        const citiBikeStations = citiBikeData.data.stations;
        const bluebikesStations = bluebikesData.data.stations;
        const divvyStations = divvyData.data.stations;
        const capitalBikeshareStations = capitalBikeshareData.data.stations;
        const niceRideStations = niceRideData.data.stations;
        const houstonBcycleStations = houstonBcycleData.data.stations;
        const madisonBikeStations = madisonBikeData.data.stations;

        const stations = [
            ...bayWheelsStations,
            ...citiBikeStations,
            ...bluebikesStations,
            ...divvyStations,
            ...capitalBikeshareStations,
            ...niceRideStations,
            ...houstonBcycleStations,
            ...madisonBikeStations,
        ];

        res.render('index', { stations });
    } catch (error) {
        console.error('Error fetching station data:', error);
        res.status(500).send('Error fetching station data');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
