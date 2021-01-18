var socket;
socket = io.connect('http://localhost:3000');

socket.emit('openBeaconPage', '');

socket.on('maplatlng', init);

socket.on('beaconNum', initilize);
socket.on('deviceLoc', mapDevice);

socket.on('address', detectProximityOf);

socket.on('selfPos', viewSelfPos);

var BEACON_NUM;
var beaconsState;
var beaconsX;
var beaconsY;
var beaconCount;

var circles;
var circleCount;

var routes;
var finishRoutes;
var polyline;
var finishPolyline;

var globalLat;
var globalLng;

// google map //////////////////////////////////////////////////////////////////
var map;
function initMap(la, ln) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: la, lng: ln },
    zoom: 18,
  });
  canvas = document.getElementById('map');
}

/////////////////////////////////////////////////////////////////////////////


function init(latlng) {
    globalLat = latlng[0];
    globalLng = latlng[1];
    initMap(globalLat, globalLng);
    socket.emit('mapReady', "");
}

function initilize(data) {
    BEACON_NUM = data;
    console.log("initilize: " + BEACON_NUM);
    beaconCount = 0;
    beaconsState = Array(BEACON_NUM);
    beaconsX = Array(BEACON_NUM);
    beaconsY = Array(BEACON_NUM);
    circles = Array(BEACON_NUM);
    routes = [];
    finishRoutes = [];
}

function mapDevice(data) {
    if (BEACON_NUM == null) return;
    beaconsX[beaconCount] = data[0];
    beaconsY[beaconCount] = data[1];
    beaconCount ++;
    if (beaconCount == BEACON_NUM) {
        console.log('scan start');
        setBeacons();
        setRoutes();
        socket.emit('noble', 1);
    }
}

function setBeacons() {
    circleCount = 1;
    for (let i = 0; i < BEACON_NUM; i++) {
        if (beaconsState[i] == 1) setBeacon([beaconsX[i], beaconsY[i]], 1);
        else setBeacon([beaconsX[i], beaconsY[i]], 0);
        circleCount ++;
    }
}

function setBeacon(latlng, isFinish) {
    if (circles[circleCount] != null) {
        circles[circleCount].setMap(null);
        circles[circleCount] = null;
    }
    circles[circleCount] = new google.maps.Circle({
        strokeColor: (isFinish == 1) ? "#FF0000" : "blue",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: (isFinish == 1) ? "#FF0000" : "blue",
        fillOpacity: 0.35,
        map,
        center: {lat: latlng[0], lng: latlng[1]},
        radius: 2,
    });
}

function setRoutes() {
    resetPolyline();
    for (let i = 0; i < BEACON_NUM; i++) {
        if (beaconsState[i] == 1) setRoute(finishRoutes, i);
        else setRoute(routes, i); 
        if (beaconsState[i] == 1 && i < BEACON_NUM - 1 && beaconsState[i + 1] != 1) setRoute(routes, i);
    }
    viewPolyLine();
}

function setRoute(r, index) {
    r.push({lat: beaconsX[index], lng: beaconsY[index]});
}

function viewPolyLine() {
    if (routes.length > 1) {
        for (let i = 0; i < routes.length; i++) console.log(routes[i]);
        polyline = new google.maps.Polyline({
            path: routes,
            geodesic: true,
            strokeColor: "blue",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });
        polyline.setMap(map);
    }

    if (finishRoutes.length > 1) {
        for (let i = 0; i < finishRoutes.length; i++) console.log(finishRoutes[i]);
        finishPolyline = new google.maps.Polyline({
            path: finishRoutes,
            geodesic: true,
            strokeColor: "red",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });
        finishPolyline.setMap(map);
    }
}

function resetPolyline() {
    if (routes.length > 0) {
        routes = [];
        if (polyline != null) {
            polyline.setMap(null);
            polyline = null;
        }
    }

    if (finishRoutes.length > 0) {
        finishRoutes = [];
        if (finishPolyline != null) {
            finishPolyline.setMap(null);
            finishPolyline = null;
        }
    }
}

function detectProximityOf(index) {
    beaconsState[index] = 1;
    setBeacons();
    setRoutes();
    console.log("detect proximity of " + index);
}

var me;
function viewSelfPos(lat_lng) {
    if (me != null) {
        me.setMap(null);
        me = null;
    }
    me = new google.maps.Circle({
        strokeColor: "yellow",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "yellow",
        fillOpacity: 0.35,
        map,
        center: {lat: lat_lng[0], lng: lat_lng[1]},
        radius: 3,
    });
}