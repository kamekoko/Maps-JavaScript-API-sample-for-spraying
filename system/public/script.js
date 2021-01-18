let canvas;
let myMap;
let img;
var socket;

var DEVICE_NUM;
var devicesState;
var devicesX;
var devicesY;
var deviceCount;

const mappa = new Mappa('Leaflet');

const options = {
    lat: 36.27740138602258, 
    lng: 136.2676594478874,
    zoom: 18,
    style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
}

function setup(){
    canvas = createCanvas(1280, 720);
    myMap = mappa.tileMap(options);
    myMap.overlay(canvas);

    // socket
    socket = io.connect('http://localhost:3000');

    // map initilization
    deviceCount = 0;
    socket.on('deviceNum', initilize);
    socket.on('deviceLoc', mapDevice);

    // proximity detection
    socket.on('address', newDrawing);

    // socket.on('map', loadMap);
}

function draw(){
}

function keyPressed(){
    var farmMap = canvas.elt.toDataURL();
    socket.emit('farm', farmMap);
    img = createImage(1200, 800);
    save(img, 'myFarm.png');
    console.log("save map");
}

function mousePressed() {
    let pos = [mouseX, mouseY];
    socket.emit('newBeacon', pos);
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
    let splitString = split(data, ','); // [index, x, y]
    let i = splitString[0];
    devicesX[i] = splitString[1];
    devicesY[i] = splitString[2];
    deviceCount ++;
    console.log(deviceCount);
    console.log('device ' + i + ': (' + devicesX[i] + ',' + devicesY[i] + ')');
    if (deviceCount == DEVICE_NUM) {
        console.log('scan start');
        drawEllipses();
    }
}

function newDrawing(data) {
    console.log('proximity detect: ' + data);
    devicesState[data] = 1;
    drawEllipses();
}

function drawEllipses() {
    clear();
    for (let i = 0; i < DEVICE_NUM; i++) {
        push();
        if (devicesState[i] == 1) fill(255,0,0);
        ellipse(devicesX[i], devicesY[i], 15, 15);
        pop();
    }
}

function printData(data){
    console.log(data);
}

function loadMap(data) {
    img = loadImage(data);
    // img = loadImage('./myFarm.png');
    image(img, 0, 0);
    console.log("load map");
}