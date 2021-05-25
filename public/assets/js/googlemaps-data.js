function simpleMap() {
    var bkly = {lat: 40.674, lng: -73.945};
    // The map, centered at Uluru
    var map = new google.maps.Map(
        document.getElementById('simpleMap'), {zoom: 7, center: bkly});
    // The marker, positioned at Uluru
    var marker = new google.maps.Marker({position: bkly, map: map});
}

function styledMap() {
    // Styles a map in night mode.
    var map = new google.maps.Map(document.getElementById('styledMap'), {
        center: {lat: 40.674, lng: -73.945},
        zoom: 12,
        styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{color: '#263c3f'}]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{color: '#6b9a76'}]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{color: '#38414e'}]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{color: '#212a37'}]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{color: '#9ca5b3'}]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{color: '#746855'}]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{color: '#1f2835'}]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{color: '#f3d19c'}]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{color: '#2f3948'}]
            },
            {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{color: '#17263c'}]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{color: '#515c6d'}]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{color: '#17263c'}]
            }
        ]
    });
}

function customMarkers() {

    var map = new google.maps.Map(document.getElementById('customMarker'), {
        zoom: 16,
        center: new google.maps.LatLng(-33.91722, 151.23064),
        mapTypeId: 'roadmap'
    });

    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    var icons = {
        parking: {
            icon: iconBase + 'parking_lot_maps.png'
        },
        library: {
            icon: iconBase + 'library_maps.png'
        },
        info: {
            icon: iconBase + 'info-i_maps.png'
        }
    };

    var features = [
        {
            position: new google.maps.LatLng(-33.91721, 151.22630),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91539, 151.22820),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91747, 151.22912),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91910, 151.22907),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91725, 151.23011),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91872, 151.23089),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91784, 151.23094),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91682, 151.23149),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91790, 151.23463),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91666, 151.23468),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.916988, 151.233640),
            type: 'info'
        }, {
            position: new google.maps.LatLng(-33.91662347903106, 151.22879464019775),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.916365282092855, 151.22937399734496),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.91665018901448, 151.2282474695587),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.919543720969806, 151.23112279762267),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.91608037421864, 151.23288232673644),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.91851096391805, 151.2344058214569),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.91818154739766, 151.2346203981781),
            type: 'parking'
        }, {
            position: new google.maps.LatLng(-33.91727341958453, 151.23348314155578),
            type: 'library'
        }
    ];

    // Create markers.
    features.forEach(function (feature) {
        var marker = new google.maps.Marker({
            position: feature.position,
            icon: icons[feature.type].icon,
            map: map
        });
    });
}

function initMap() {
    simpleMap();
    customMarkers();
    styledMap();
}

