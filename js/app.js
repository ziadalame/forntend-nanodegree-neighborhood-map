var map;
var service;
var infowindow;
var allCafes;

function infoWindowHTML(cafe) {
    // fix data to pass a string url to the template
    cafe.photo = typeof cafe.photos !== 'undefined' ? cafe.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300}) : 'https://placehold.it/200/100';
    
    var source = $("#cafe-window-template").html();
    var template = Handlebars.compile(source);
    
    return template(cafe);
}

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
    service.textSearch(request, function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            allCafes = results;
            ko.applyBindings(new ViewModel());
        }
    });
};

// Cafe constructor
var Cafe = function (data) {
    // Map the properties from the places object to the cafe object and make them observables
    this.formatted_address = ko.observable(data.formatted_address);
    this.gMapsId = ko.observable(data.id);
    this.name = ko.observable(data.name);
    this.placeId = ko.observable(data.place_id);
    this.priceLevel = ko.observable(data.price_level);
    this.rating = ko.observable(data.rating);
    this.reference = ko.observable(data.reference);
    this.tags = ko.observable(data.types);
    this.lat = ko.observable(data.geometry.location.lat());
    this.lng = ko.observable(data.geometry.location.lng());

    this.photo = typeof data.photos !== 'undefined' ? ko.observable(data.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 100})) : ko.observable('https://placehold.it/200/100');

    // create a marker object for every cafe
    this.marker = new google.maps.Marker({
        map: map,
        position: data.geometry.location
    });

    // Add listener for marker and set content
    google.maps.event.addListener(this.marker, 'click', function () {
        infowindow.setContent(infoWindowHTML(data));
        infowindow.open(map, this);
    });


    // filtering variables
    this.isVisible = ko.observable(true);
};

var ViewModel = function () {
    // get reference for VM context
    var self = this;
    var marker;

    // An observanle array of cafes to keep track - start with an empty array
    this.cafeList = ko.observableArray([]);

    // data is a single cafe
    allCafes.forEach(function (data) {
        self.cafeList.push(new Cafe(data));
    });

    this.showInfoWindowForCafe = function (cafe) {
        google.maps.event.trigger(cafe.marker, 'click');
    }

    // Filter by user input
    this.searchQuery = ko.observable('');
    this.filterCafes = ko.computed(function () {
        var query = self.searchQuery().toLowerCase();
        // close any open info window to avoid hiding pin and keeping info window
        infowindow.close();
        // Filter the observable and hide misfits
        ko.utils.arrayFilter(self.cafeList(), function (cafe) {
            // manage item in list
            cafe.isVisible(cafe.name().toLowerCase().indexOf(query) !== -1);
            // manage item in google maps
            cafe.marker.setVisible(cafe.name().toLowerCase().indexOf(query) !== -1);
        });
    });

    this.isMenuVisible = ko.observable(true);
    this.toggleMenu = function () {
        self.isMenuVisible(!self.isMenuVisible());
    };
};



// Handlebars

Handlebars.registerHelper('priceRange', function (range) {
    var temp = '';
    for (var i = 0; i < range; i++) {
        temp += '$';
    }
    return temp;
});