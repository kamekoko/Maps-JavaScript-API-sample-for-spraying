var socket;
socket = io.connect('http://localhost:3000');

socket.emit('openRoutesPage', '');

socket.on('maplatlng', init);

socket.on('beaconNum', initilize);
socket.on('deviceLoc', mapDevice);

socket.on('beaconData', viewBeaconData);

// google map //////////////////////////////////////////////////////////////////
var map;
var lat;
var lng;
function initMap(la, ln) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: la, lng: ln },
    zoom: 18,
  });
  canvas = document.getElementById('map');


}

var marker = [];
var markerCount = 0;
var DEVICE_NUM;
var devicesState;
var devicesX;
var devicesY;
var deviceCount;

function init(latlng) {
    lat = latlng[0];
    lng = latlng[1];
    // initMap(lat, lng);
    socket.emit('mapReady', "");
}

function initilize(data) {
    DEVICE_NUM = data;
    console.log("initilize: " + DEVICE_NUM);
    deviceCount = 0;
    devicesState = Array(DEVICE_NUM);
    devicesX = Array(DEVICE_NUM);
    devicesY = Array(DEVICE_NUM);
}

function mapDevice(data) {
    if (DEVICE_NUM == null) return;
    devicesX[deviceCount] = data[0];
    devicesY[deviceCount] = data[1];
    console.log(deviceCount);
    console.log('device ' + deviceCount + ': (' + devicesX[deviceCount] + ',' + devicesY[deviceCount] + ')');
    deviceCount ++;
    if (deviceCount == DEVICE_NUM) {
        console.log('scan start');
        initMap(lat, lng);
        setMarkers();
    }
}

function setMarkers() {
    for (let i = 0; i < DEVICE_NUM; i++) {
        setMarker([devicesX[i], devicesY[i]]);
    }
}

function setMarker(latlng) {
    console.log(latlng[0] + "," + latlng[1]);
    marker[markerCount] = new google.maps.Marker({
        position: new google.maps.LatLng(latlng[0], latlng[1]),
        map: map,
    });
    map.panTo(new google.maps.LatLng(latlng[0], latlng[1]));
    marker[markerCount].setLabel("ビーコン" + (markerCount + 1));
    markerCount ++;

    map.addListener(marker[markerCount], 'click', function(e) {
        console.log('yes: ' + e.latlng);
        getClickLatLng(e.latLng);
    });
}

// add beacon to routes /////////////////////////////////////////////////////////////////////////
var routesLength = 1;
var routes = [];
var b_latlng;

function getClickLatLng(lat_lng) {
    b_latlng = null;
    b_latlng = lat_lng;
    console.log(lat_lng);
}

function viewBeaconData(data) {
    var node = document.createElement('route');
    node.innerHTML = '[' + routesLength + '] : name: ' + data[0] + ', address: ' + data[1];
    document.getElementById("beaconList").appendChild(node);
    routes.push([data[0], data[1]]);
}

function setBeaconAsRoutes() {
    console.log('push: ' + b_latlng);
    if (b_latlng == null) return;
    socket.emit('pushBeaconToRoutes', [b_latlng.lat, b_latlng.lng]);
    routesLength ++;

    viewBeaconData([b_latlng.lat, b_latlng.lng]);
}

function resetRadio() {
    if (routesLength == 1) return;
    routes.pop();
    routesLength --;
    var list = document.getElementById("beaconList");
    var node = list.lastElementChild;
    list.removeChild(node);
}