var socket;
socket = io.connect('http://localhost:3000');

socket.emit('openMapSelectPage', "");
socket.on('latlng', printFiles);

var map;
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.27740138602258, lng: 136.2676594478874 },
    zoom: 18,
  });
  canvas = document.getElementById('map');
}

var marker;
var mapCount = 1;
function setMarker(latlng) {
    console.log(latlng[0] + "," + latlng[1]);
    marker = new google.maps.Marker({
        position: new google.maps.LatLng(latlng[0], latlng[1]),
        map: map,
    });
    map.panTo(new google.maps.LatLng(latlng[0], latlng[1]));
    marker.setLabel("圃場" + mapCount);
}

function printFiles(latlng) {
    var node = document.createElement('radio');
    node.innerHTML = '<input type="radio" name="farm" id="check' + mapCount + '" value="' + mapCount + '">' + '圃場' + mapCount;
    document.getElementById("mapList").appendChild(node);
    setMarker(latlng);
    mapCount ++;
}

function sendMapNum() {
    const farms = document.getElementsByName("farm");
    for (let i = 0; i < farms.length; i++) {
        if (farms[i].checked) {
            console.log(farms[i].value);
            socket.emit('mapNum', farms[i].value);
            break;
        }
    }
}