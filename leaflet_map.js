let map = L.map('map').setView([56, -3.5], 6);

// Background mapping tile layer
//L.tileLayer('http://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c'],
    maxZoom: 18,
    //id: 'mapbox/streets-v11',
    //tileSize: 512,
    //zoomOffset: -1,
    //accessToken: 'pk.eyJ1IjoiYXJpY29vcGVyZGF2aXMiLCJhIjoiY2t3bHo1NjN4MXI3aTJ3bWQ4cXA4b2ljciJ9.bV0roZ5YiqR6PhMmzIQZcw'
}).addTo(map);

// SSSI WMS layers
let england = L.tileLayer.wms('http://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/wms', {
    layers: 'Sites_of_Special_Scientific_Interest_England',
    format: 'image/png',
    transparent: 'true',
    minZoom: 11,
    opacity: 0.5,
    //minNativeZoom: 11,
});
england.addTo(map);
let scotland = L.tileLayer.wms('http://cagmap.snh.gov.uk/arcgis/services/snh_protected_sites/MapServer/WMSServer', {
    layers: '2',
    format: 'image/png',
    transparent: 'true',
    minZoom: 11,
    //minNativeZoom: 1,
});
scotland.addTo(map);
let wales = L.tileLayer.wms('http://lle.gov.wales/services/wms/nrw', {
    layers: 'NRW_SSSI',
    format: 'image/png',
    transparent: 'true',
    minZoom: 11,
    //minNativeZoom: 1,
});
wales.addTo(map);

// Feature markers
let registries = {
    'CCC': '#ff7f0e',
    'CNCC': '#1f77b4',
    'DCA': '#2ca02c',
    'DCUC': '#e377c2',
    'FoDCCAG': '#9467bd',
    'GSG': '#8c564b',
    'MCRA': '#d62728',
    'Northern Caves': '#7f7f7f'
};
let caves = {}
fetch('features.geojson')
    .then(response => response.json())
    .then(jsonResponse => {

        // Add geoJSON layers to object and add to map
        Object.keys(registries).forEach(function(source) {
            caves[source] = L.geoJSON(jsonResponse, {
                filter: function(feature, layer) {
                    return feature.properties.source_registry == source;
                },
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        color: registries[feature.properties.source_registry],
                        opacity: 1,
                        fillOpacity: 0.5,
                    });
                },
                onEachFeature: function(feature, layer) {
                    layer.bindPopup(`<b>${feature.properties.cave_name}</b><br><b>SSSI</b>: ${feature.properties.sssi}<br><b>Source</b>: ${feature.properties.source_registry}`);
                },
            });
        });
        Object.keys(caves).forEach(source => caves[source].addTo(map));

        // Control UI
        caves = Object.fromEntries(Object.entries(caves).map(function(c) {
            let icon = '<i class="circle" style="background: '+registries[c[0]]+'"></i>';
            return [icon+'&nbsp;'+c[0], c[1]]
        }));
        let legend = L.control.layers(null, Object.assign({}, {
            "<img src='http://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/wms?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=Sites_of_Special_Scientific_Interest_England&style=default&'/>&nbsp;England SSSIs": england,
            "<img src='http://cagmap.snh.gov.uk/arcgis/services/snh_protected_sites/MapServer/WMSServer?service=WMS&request=GetLegendGraphic&version=1.3.0&format=image/png&layer=2&'/>&nbsp;Scotland SSSIs": scotland,
            "<img src='http://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WMS&request=GetLegendGraphic&format=image/png&layer=NRW_SSSI&'/>&nbsp;Wales SSSIs": wales,
        }, caves));
        legend.addTo(map);

        document.getElementsByClassName('leaflet-control-layers-overlays')[0].insertAdjacentHTML('beforebegin', '<h4><b>SSSIs</b></h4>');
        document.getElementsByClassName('leaflet-control-layers-overlays')[0].children[3].insertAdjacentHTML('beforebegin', '<p></p><h4><b>Caves</b></h4>');
    });

// UI layers
let infobox = L.control({position: 'bottomright'});
infobox.onAdd = function(map) {
    let div = L.DomUtil.create('div', 'infobox');
    div.innerHTML += '<h4>SSSI Cave Entrances</h4>' +
        'Map of cave features on SSSIs in Great Britain.<br><br>Zoom in for SSSI boundaries. Click on markers for details.' +
        '<br><br><a href="https://github.com/aricooperdavis/SSSI-Cave-Entrances">Sources and more info</a>.';
    return div;
};
infobox.addTo(map);
