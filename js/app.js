var map;
var service;
var infowindow;

function initApp() {
    var newYork = new google.maps.LatLng(40.730610, -73.935242);

    map = new google.maps.Map(document.getElementById('map'), {
        center: newYork,
        zoom: 11,
    });

    infowindow = new google.maps.InfoWindow();

    var request = {
        location: newYork,
        type: 'cafe',
        radius: 10000,
        query: 'open 24'
    };

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
};

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
        }
    }
};

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
};