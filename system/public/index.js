var socket;
socket = io.connect('http://localhost:3000');

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

  // Create the search box and link it to the UI element.
  // const input = document.getElementById("pac-input");
  // const searchBox = new google.maps.places.SearchBox(input);
  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // map.addListener("bounds_changed", () => {
  //   searchBox.setBounds(map.getBounds());
  // });
}

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
  socket.emit('resisterMap', marker.getPosition());
}

socket.on('confirm', latlng => {
  $('<p>圃場を登録しました : [' + latlng.lat + " , " + latlng.lng + ']</p>').prependTo('#displayOfAddedMap');
});