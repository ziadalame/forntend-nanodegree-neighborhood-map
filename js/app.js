var map;
var service;
var infowindow;
var allCafes;

var foursquare = {
    id: 'RYINVIBWFMYQTQSQTA00OFUELYHZFRN5BPHVJV55V3AKNIQZ',
    secret: 'MM1KRKEAA04011T40RLPUFUCNWNOCGD0ZINHTBSPTY4J1CJ3'
}

// Show error after 10 if google maps isn't ready
setTimeout(function () {
    if (!window.google || !window.google.maps) {
        $('#map').css('text-align', 'center');
        $('#map').html('<h2>We are sorry for the inconvinience but an error has occurred. Please try refreshing the page.</h2>');
    }
}, 5000);


// Initialize after map api has been loaded
function initApp() {
    // Set center to new york city
    var newYork = new google.maps.LatLng(40.730610, -73.935242);

    // append map
    map = new google.maps.Map(document.getElementById('map'), {
        center: newYork,
        zoom: 11,
    });

    // create generic info window to set content within
    infowindow = new google.maps.InfoWindow();

    // Request cafes that open 24 hours from the google places api
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
            // All is ready. Binding the ViewModel to the View
            ko.applyBindings(new ViewModel());
        }
    });
};

// Cafe Model
var Cafe = function (data) {
    // Add reference to context
    var self = this;

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
    // Make sure there is a photo
    this.photo = typeof data.photos !== 'undefined' ? ko.observable(data.photos[0].getUrl({ 'maxWidth': 300, 'maxHeight': 100 })) : ko.observable('https://placehold.it/200/100');

    // create a marker object for every cafe
    this.marker = new google.maps.Marker({
        map: map,
        position: data.geometry.location,
        // intial animation when page loads
        animation: google.maps.Animation.DROP
    });

    // Add listener for marker and set content
    google.maps.event.addListener(this.marker, 'click', function () {
        // Marker animation
        var that = this;
        if (self.marker.getAnimation() === null) {
            // start bouncing
            self.marker.setAnimation(google.maps.Animation.BOUNCE);
        }
        // Center map on selecter pin
        map.setCenter(data.geometry.location);
        // Add content and show info window
        $.ajax({
            type: 'GET',
            url: 'https://api.foursquare.com/v2/venues/search?v=20170101&query=' + encodeURI(data.name) + '&ll=' + data.geometry.location.lat() + ',' + data.geometry.location.lng() + '&limit=1&client_id=' + foursquare.id + '&client_secret=' + foursquare.secret,
        }).success(function (foursquareData) {
            self.foursquare = ko.observable(foursquareData.response.venues[0]);
            data.foursquare = foursquareData.response.venues[0];
            console.log(foursquareData);
        }).fail(function (response, error) {
            console.log('error');
            console.log(error);
        }).always(function () {
            infowindow.setContent(infoWindowHTML(data));
            infowindow.open(map, that);
            self.marker.setAnimation(null);
        });


    });

    // filtering variables
    this.isVisible = ko.observable(true);
};

// The ViewModel
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

    // trigger infowindow to open
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

    // Sets the menu to visible initially
    this.isMenuVisible = ko.observable(true);
    // Toggle menu status from visible to hidden vias css classes - check HTML to see how it is done
    this.toggleMenu = function () {
        // toggle state
        self.isMenuVisible(!self.isMenuVisible());
    };
};



// Handlebars Helpers

// Return a symbol of proce rang
// $ => cheap || $$ => more expensive || $$$ => even more expensive || etc.
Handlebars.registerHelper('priceRange', function (range) {
    var temp = '';
    for (var i = 0; i < range; i++) {
        temp += '$';
    }
    return temp;
});

Handlebars.registerHelper( 'concat', function(s1, s2) {
    return s1 + s2;
});

// Helper functions

// Generate infowindow HTML dynamically with handlebase
function infoWindowHTML(cafe) {
    // fix data to pass a string url to the template
    cafe.photo = typeof cafe.photos !== 'undefined' ? cafe.photos[0].getUrl({ 'maxWidth': 300, 'maxHeight': 300 }) : 'https://placehold.it/200/100';
    // Get HTML
    var source = $("#cafe-window-template").html();
    // Compile HTML to understand it and fill data afterwards
    var template = Handlebars.compile(source);
    // Return populated HTML with data
    return template(cafe);
}