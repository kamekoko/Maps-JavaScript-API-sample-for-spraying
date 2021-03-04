var socket;
socket = io.connect('http://localhost:3000');
socket.emit('openBeaconPage', '');
socket.on('maplatlng', init);
socket.on('beaconNum', initilize);
socket.on('deviceLoc', mapDevice);
socket.on('beaconData', viewBeaconData);

var map;
function initMap(la, ln) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: la, lng: ln },
    zoom: 18,
  });
  canvas = document.getElementById('map');

  map.addListener('dblclick', function(e) {
    getClickLatLng(e.latLng, map);
  });
}

var marker = [];
var markerCount = 0;
var DEVICE_NUM;
var devicesState;
var devicesX;
var devicesY;
var deviceCount;

function init(latlng) {
    var lat = latlng[0];
    var lng = latlng[1];
    initMap(lat, lng);
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
        // icon: "./icon/icons8-marker50.png",
    });
    map.panTo(new google.maps.LatLng(latlng[0], latlng[1]));
    marker[markerCount].setLabel("ビーコン" + (markerCount + 1));
    markerCount ++;
}

var newBeacons = [];
var newMarker;

function setNewMarker(latlng) {
    console.log(latlng[0] + "," + latlng[1]);
    newMarker = new google.maps.Marker({
        position: new google.maps.LatLng(latlng[0], latlng[1]),
        map: map,
    });
    map.panTo(new google.maps.LatLng(latlng[0], latlng[1]));
    newMarker.setLabel("ビーコン" + (markerCount + 1));
    markerCount ++;
}

function getClickLatLng(lat_lng, map) {
    if (newMarker != null) {
        newMarker = null;
        newMarker.setMap(null);
        markerCount --;
    }
    setNewMarker([lat_lng.lat(), lat_lng.lng()]);
    socket.emit('newBeacon', 0);
}

function viewBeaconData(data) {
    var node = document.createElement('radio');
    node.innerHTML = '<label style="display: block;"><input type="radio" name="beacon" id="check' + markerCount + '" value="' + markerCount + '">' + 'name: ' + data[0] + ', address: ' + data[1] + '</label>';
    document.getElementById("beaconList").appendChild(node);
    newBeacons.push([data[0], data[1]]);
}

function selectBeacon() {
    const beacons = document.getElementsByName("beacon");
    for (let i = 0; i < beacons.length; i++) {
        if (beacons[i].checked) {
            console.log(newBeacons[i][1] + " is ressistered");
            socket.emit('setBeacon', [newMarker.getPosition().lat(), newMarker.getPosition().lng(), newBeacons[i][0], newBeacons[i][1]]);
            $('<p>ビーコン ' + newBeacons[i][1] + ' を登録しました</p>').prependTo('#displayOfAddedBeacon');
            break;
        }
    }
}

function resetRadio() {
    newMarker.setMap(null);
    newMarker = null;
    markerCount --;
    socket.emit('stopNoble', "");

    // html の beaconListも本当は初期化したいけど消えない
    // jquery，remove()試したけどできない
}