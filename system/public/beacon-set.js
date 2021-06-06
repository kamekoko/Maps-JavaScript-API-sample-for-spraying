let canvas;
let img;
var socket;
let myMap;

var DEVICE_NUM;
var devicesState;
var devicesX;
var devicesY;
var deviceCount;

const key = 'API_KEY';
const mappa = new Mappa('Google', key);

const style = [{
    elementType: 'geometry',
    stylers: [{
        color: '#242f3e',
    }],
}];

var options = {
    lat: 36.27740138602258, 
    lng: 136.2676594478874,
    zoom: 19,
    style: style
};

function setup(){
    canvas = createCanvas(1280, 720);
    socket = io.connect('http://localhost:3000');
    socket.emit('openBeaconPage', '');

    socket.on('maplatlng', initMap);

    socket.on('beaconNum', initilize);
    socket.on('deviceLoc', mapDevice);
}

function draw(){
}

function mousePressed() {
    console.log(mouseX + "," + mouseY);
    const position = myMap.pixelToLatLng(mouseX, mouseY);
    console.log("pos: " + position);
    socket.emit('newBeacon', position);
}

function initMap(latlng) {
    options.lat = latlng[0];
    options.lng = latlng[1];
    myMap = mappa.tileMap(options);
    myMap.overlay(canvas);
    socket.emit('initMapOk', "");
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
        drawEllipses();
    }
}

function drawEllipses() {
    clear();
    for (let i = 0; i < DEVICE_NUM; i++) {
        push();
        if (devicesState[i] == 1) fill(255,0,0);
        console.log("lat lng: " + devicesX[i] + "," + devicesY[i]);
        // const pos = myMap.latLngToPixel(devicesX[i], devicesY[i]);
        // console.log("pixel: " + pos.x + "," + pos.y);
        ellipse(devicesX[i], devicesY[i], 15, 15);
        pop();
    }
}