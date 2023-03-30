const express = require('express');
const app = express();

app.set('view engine', 'ejs');
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', async (req, res) => {
//     const fetch = (await import('node-fetch')).default;

//     const bayWheelsUrl = 'https://gbfs.baywheels.com/gbfs/en/station_information.json';
//     const citiBikeUrl = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';
//     const bluebikesUrl = 'https://gbfs.bluebikes.com/gbfs/en/station_information.json';

//     try {
//         const [bayWheelsResponse, citiBikeResponse, bluebikesResponse] = await Promise.all([
//             fetch(bayWheelsUrl),
//             fetch(citiBikeUrl),
//             fetch(bluebikesUrl),
//         ]);

//         const [bayWheelsData, citiBikeData, bluebikesData] = await Promise.all([
//             bayWheelsResponse.json(),
//             citiBikeResponse.json(),
//             bluebikesResponse.json(),
//         ]);

//         const bayWheelsStations = bayWheelsData.data.stations;
//         const citiBikeStations = citiBikeData.data.stations;
//         const bluebikesStations = bluebikesData.data.stations;

//         const stations = [...bayWheelsStations, ...citiBikeStations, ...bluebikesStations];

//         res.render('index', { stations });
//     } catch (error) {
//         console.error('Error fetching station data:', error);
//         res.status(500).send('Error fetching station data.');
//     }
// });

async function handleResponse(response) {
    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.warn(`Error ${response.status} while fetching bike station data.`);
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
    // const bixiUrl = 'https://gbfs.bixi.com/gbfs/en/station_information.json'; London
    // const citiBikeMiamiUrl = 'https://mds.bird.co/gbfs/citibikemiami/en/station_information.json';
    const houstonBcycleUrl = 'https://gbfs.bcycle.com/bcycle_houston/station_information.json';
    const madisonBikeShareUrl = "https://gbfs.bcycle.com/bcycle_madison/station_information.json";

    try {
        const [
            bayWheelsResponse,
            citiBikeResponse,
            bluebikesResponse,
            divvyResponse,
            capitalBikeshareResponse,
            niceRideResponse,
            houstonBcycleResponse,
            madisonBikeShareResponse,
        ] = await Promise.all([
            fetch(bayWheelsUrl),
            fetch(citiBikeUrl),
            fetch(bluebikesUrl),
            fetch(divvyUrl),
            fetch(capitalBikeshareUrl),
            fetch(niceRideUrl),
            fetch(houstonBcycleUrl),
            fetch(madisonBikeShareUrl),
        ]);

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
            handleResponse(bayWheelsResponse),
            handleResponse(citiBikeResponse),
            handleResponse(bluebikesResponse),
            handleResponse(divvyResponse),
            handleResponse(capitalBikeshareResponse),
            handleResponse(niceRideResponse),
            handleResponse(houstonBcycleResponse),
            handleResponse(madisonBikeShareResponse),
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
