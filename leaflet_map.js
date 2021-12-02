let map = L.map('map').setView([56, -3.5], 6);

// Background mapping tile layer
//L.tileLayer('http://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c'],
    maxZoom: 18,
}).addTo(map);

// SSSI WMS layers
let wms = {
    'england': {
        'address': 'http://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/wms',
        'layer': 'Sites_of_Special_Scientific_Interest_England',
    },
    'scotland': {
        'address': 'http://cagmap.snh.gov.uk/arcgis/services/snh_protected_sites/MapServer/WMSServer',
        'layer': '2',
    },
    'wales': {
        'address': 'http://lle.gov.wales/services/wms/nrw',
        'layer': 'NRW_SSSI',
    },
}
Object.keys(wms).forEach(k => {
    wms[k]['leaf'] = L.tileLayer.wms(wms[k]['address'], {
        layers: wms[k]['layer'],
        format: 'image/png',
        transparent: 'true',
        minZoom: 11,
        opacity: (k == 'england' ? 0.5 : 1),
    });
    wms[k]['leaf'].addTo(map);
});

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
let sssis = {
    'E': 'https://designatedsites.naturalengland.org.uk/SiteDetail.aspx?SiteCode=S',
    'S': 'https://sitelink.nature.scot/site/',
    'W': 'https://naturalresources.wales/guidance-and-advice/environmental-topics/wildlife-and-biodiversity/protected-areas-of-land-and-seas/find-protected-areas-of-land-and-sea?lang=en&',
};
fetch('features.geojson')
    .then(response => response.json())
    .then(jsonResponse => {
        // Add geoJSON layers to object and add to map
        let caves = {}
        Object.keys(registries).forEach(function(source) {
            caves[source] = L.geoJSON(jsonResponse, {
                filter: function(feature, layer) {
                    return feature.properties.r == source;
                },
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        color: registries[feature.properties.r],
                        opacity: 1,
                        fillOpacity: 0.5,
                    });
                },
                onEachFeature: function(feature, layer) {
                    layer.bindPopup(`<b>${feature.properties.n}</b><br><b>SSSI</b>: <a href="${sssis[feature.properties.c]}${(feature.properties.i)}">${feature.properties.s}</a><br><b>Source</b>: ${feature.properties.r}`);
                },
            });
        });
        Object.keys(caves).forEach(source => caves[source].addTo(map));

        // Control UI
        caves = Object.fromEntries(Object.entries(caves).map(function(c) {
            let icon = '<i class="circle" style="background: '+registries[c[0]]+'"></i>';
            return [icon+'&nbsp;'+c[0], c[1]]
        }));
        let legend = L.control.layers(null, Object.assign({},
            Object.fromEntries(
                Object.keys(wms).map(function(k) {
                    return [`<img src='${wms[k]['address']}?version=1.3.0&request=GetLegendGraphic&format=image/png&layer=${wms[k]['layer']}'/>&nbsp;${k[0].toUpperCase()}${k.substr(1)}`, wms[k]['leaf']];
                })
            ),
            caves));
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
