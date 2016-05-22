// make the map
var mapDivId = 'map';
var map = new L.Map(mapDivId);

// set its view
var iowacity = [41.6667, -91.5333];
var building9 = [41.6667, -91.5333]
var zoom = 14;
map.setView(iowacity, zoom);

// make and add a layer
var stamen_layers = ['toner', 'watercolor'];
var chosen_layer = stamen_layers[0];
var layer = new L.StamenTileLayer(chosen_layer);
map.addLayer(layer);
