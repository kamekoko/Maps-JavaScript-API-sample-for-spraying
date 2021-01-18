let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.27740138602258, lng: 136.2676594478874 },
    zoom: 18,
  });
  canvas = document.getElementById('map');

  map.addListener('click', function(e) {
    getClickLatLng(e.latLng, map);
  });
}

var socket;
socket = io.connect('http://localhost:3000');

// marker set
var marker;

function getClickLatLng(lat_lng, map) {
  if (marker != null) {
    marker.setMap(null);
    marker = null;
  }
  document.getElementById('lat').textContent = lat_lng.lat();
  document.getElementById('lng').textContent = lat_lng.lng();
  marker = new google.maps.Marker({
    position: lat_lng,
    map: map,
  });
  map.panTo(lat_lng);
}

function resisterMap() {
  if (marker == null) return;
  socket.emit('marker', marker.getPosition());
}