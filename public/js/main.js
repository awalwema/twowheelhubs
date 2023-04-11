let stations = [];
let markers = [];
let map;
let destinationMarker = null;
let directionsRenderer = null;
let directionsService = null;
let autocomplete;
let userMarker = null;
let selectedMarker = null;



const bikeIcon = {
    url: '/images/icons8-sphere-50.png',
    scaledSize: new google.maps.Size(15, 15),
};

const selectedBikeIcon = {
    url: '/images/icons8-sphere-50-blue.png', // You can change the color or replace the URL with your own icon
    scaledSize: new google.maps.Size(20, 20),
};

function showInfoWindow(marker, content) {
    if (infoWindow) {
        infoWindow.close();
    }
    // const infoContent = `<div>${content}</div><button id="go-button">Go</button>`;
    const infoContent = `<div>${content}</div><button id="go-button" style="font-size: 12px; padding: 4px 8px;"><span>Go</span> <img src="/images/icons8-direction-turn-48.png" alt="Go" style="width: 16px; height: 16px; vertical-align: middle; margin-left: 4px;"></button>`;
    infoWindow = new google.maps.InfoWindow({
        content: infoContent,
    });
    infoWindow.open(map, marker);

    // Add a click event listener for the "Go" button
    google.maps.event.addListener(infoWindow, 'domready', () => {
        const goButton = document.getElementById('go-button');
        goButton.addEventListener('click', directUser.bind(marker));
    });
}

function isIOS() {
    return (
        ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) ||
        (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    );
}

function showUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                // Center the map on the user's location and set the zoom level
                map.setCenter(userLocation);
                map.setZoom(15);

                // Add a marker for the user's location
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "Your location",
                        icon: {
                            url: "/images/icons8-delivery-pin-for-parcel-delivery-location-making-24.png", // Change the URL to the desired icon
                            scaledSize: new google.maps.Size(30, 30), // Adjust the size as needed
                        },

                    });
                } else {
                    userMarker.setPosition(userLocation);
                }
            },
            (error) => {
                alert("Error: " + error.message);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}


function handleClick() {
    showInfoWindow(this, this.getTitle());
}

function directUser() {
    const station = this;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLatLng.lat()},${userLatLng.lng()}&destination=${station.getPosition().lat()},${station.getPosition().lng()}&travelmode=bicycling`;
                const appleMapsUrl = `http://maps.apple.com/?saddr=${userLatLng.lat()},${userLatLng.lng()}&daddr=${station.getPosition().lat()},${station.getPosition().lng()}&dirflg=b`;

                if (isIOS()) {
                    // Show the modal for iOS users
                    const modal = document.getElementById("modal");
                    modal.style.display = "block";

                    // Set data attributes with map URLs on the buttons
                    document.getElementById("open-apple-maps").setAttribute("data-url", appleMapsUrl);
                    document.getElementById("open-google-maps").setAttribute("data-url", googleMapsUrl);
                } else {
                    showLoadingScreen()
                    // Open Google Maps URL for other devices
                    const link = document.getElementById("map-link");
                    link.setAttribute("href", googleMapsUrl);
                    link.click();
                }
            },
            () => {
                alert("Error: Geolocation is not available or permission is denied.");
                hideLoadingScreen()
            }
        );
    } else {
        alert("Error: Geolocation is not supported by this browser.");
    }
}







function showModal() {
    const modalContainer = document.querySelector('.modal-container');
    modalContainer.style.display = 'block';
}


document.querySelector('.close').addEventListener('click', () => {
    const modalContainer = document.querySelector('.modal-container');
    modalContainer.style.display = 'none';
});

document.getElementById("open-apple-maps").addEventListener("click", function () {
    const modalContainer = document.querySelector('.modal-container');
    modalContainer.style.display = 'none';
    openMapApp(this.getAttribute("data-url"));
});

document.getElementById("open-google-maps").addEventListener("click", function () {
    const modalContainer = document.querySelector('.modal-container');
    modalContainer.style.display = 'none';
    openMapApp(this.getAttribute("data-url"));
});

function openMapApp(url) {
    const link = document.getElementById("map-link");
    link.setAttribute("href", url);
    link.click();

    // Close the modal
    document.getElementById("modal").style.display = "none";
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
}

async function getDestinationCoordinates(destination) {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: destination }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();
                resolve({ lat, lng });
            } else {
                reject('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
}

async function findClosestStations(destinationLatLng, numberOfStations) {
    const distances = stations.map((station) => {
        const stationLatLng = new google.maps.LatLng(station.lat, station.lon);
        return {
            station: station,
            distance: google.maps.geometry.spherical.computeDistanceBetween(
                destinationLatLng,
                stationLatLng
            ),
        };
    });

    distances.sort((a, b) => a.distance - b.distance);

    return Promise.resolve(distances.slice(0, numberOfStations).map((item) => item.station));
}

let infoWindow;

async function displayClosestStations() {
    const destination = document.getElementById('destination').value;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destination.toString() }, async (results, status) => {
        if (status === 'OK') {
            const destinationLatLng = results[0].geometry.location;

            // Set the map center to the destination
            map.setCenter(destinationLatLng);

            // Remove the previous destination marker if it exists
            if (destinationMarker) {
                destinationMarker.setMap(null);
            }

            // Create a new destination marker with the default red icon
            destinationMarker = new google.maps.Marker({
                position: destinationLatLng,
                map: map,
                title: destination,
            });

            const closestStations = await findClosestStations(destinationLatLng, 5);

            // Remove existing markers
            removeMarkers();

            const list = document.getElementById('closest-stations');
            list.innerHTML = '';

            closestStations.forEach((station, index) => {
                const marker = new google.maps.Marker({
                    position: {
                        lat: station.lat,
                        lng: station.lon,
                    },
                    map: map,
                    title: station.name,
                    icon: bikeIcon,
                });

                marker.addListener('click', handleClick);



                markers.push(marker);

                // Add a unique station ID for each list item
                const stationId = `station-${index}`;

                const li = document.createElement('li');
                li.textContent = `${station.name}`;
                li.id = stationId;
                li.style.cursor = 'pointer';
                list.appendChild(li);

                // Add the click event listener to the list item
                li.addEventListener('click', () => {
                    showInfoWindow(marker, station.name);
                });



            });

        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function addListItemClickListener(stationId, marker) {
    const listItem = document.getElementById(stationId);
    listItem.addEventListener('click', () => {
        openModal(marker.title, marker.position.lat(), marker.position.lng());
    });
}



function openModal(stationName, lat, lon) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const goButton = document.getElementById('go-button');

    if (modal && modalTitle && goButton) {
        modalTitle.textContent = stationName;

        goButton.onclick = () => {
            window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=bicycling`;
        };

        modal.style.display = 'block';
    } else {
        console.error('Modal elements not found');
    }
}



function initAutocomplete(map) {
    const input = document.getElementById('destination');
    autocomplete = new google.maps.places.Autocomplete(input);

    // Add a listener for the place_changed event
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }
        displayClosestStations();
    });
}

function removeMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

async function requestDirections(origin, destination) {
    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.BICYCLING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            alert('Directions request failed due to ' + status);
        }
    });
}

document.getElementById('locate').addEventListener('click', () => {
    showUserLocation();
});



document.addEventListener('DOMContentLoaded', async () => {
    const jsonString = document.getElementById('map').dataset.stations;

    if (jsonString) {
        stations = JSON.parse(jsonString);
    } else {
        console.error('Error: JSON data not found');
    }



    function initMap(stations, callback) {
        try {
            console.log('Initializing map...');
            const mapDiv = document.getElementById('map');
            console.log('Map div:', mapDiv);
            map = new google.maps.Map(mapDiv, {
                zoom: 13,
            });
            console.log('Map:', map);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        // map.setCenter(userLatLng);
                        showUserLocation()
                    },
                    () => {
                        // If geolocation is not available or permission is denied, default to San Francisco
                        map.setCenter(new google.maps.LatLng(37.7749, -122.4194));
                    }
                );
            } else {
                // If geolocation is not supported, default to San Francisco
                map.setCenter(new google.maps.LatLng(37.7749, -122.4194));
            }

            // Initialize DirectionsRenderer and DirectionsService
            directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);
            directionsService = new google.maps.DirectionsService();

            stations.forEach((station) => {
                const position = new google.maps.LatLng(station.lat, station.lon);
                const marker = new google.maps.Marker({
                    position,
                    map,
                    title: station.name,
                    icon: bikeIcon,
                    title: station.name,
                });

                marker.addListener('click', handleClick);


                markers.push(marker);
            });
            console.log('Markers:', markers);

            if (callback) {
                callback(map);
            }
            console.log('Map initialization complete.');
        } catch (error) {
            console.error(error);
        }
    }


    initMap(stations, (map) => {
        initAutocomplete(map);
    });
});


document.getElementById('search').addEventListener('click', () => {
    const destination = document.getElementById('destination').value;
    displayClosestStations(destination);
});

