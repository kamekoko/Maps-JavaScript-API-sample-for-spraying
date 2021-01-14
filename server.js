const fs = require('fs');

var settings = require('./settings')
const express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

/////////////////////////////////////////////////////////////////////
// set farm
/////////////////////////////////////////////////////////////////////
var mapCount;
fs.readdir('public/map', (err, files) => { 
    if (files.length == null) mapCount = 0; 
    else mapCount = files.length;
})

function addMap(latlng) {
    mapCount++;
    let newGeoJSON = '{ "type": "Point", "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}, "coordinates": [' + latlng.lat + ', ' + latlng.lng + ']}';
    const mapfile = "public/map/map" + mapCount + ".geojson";
    fs.writeFileSync(mapfile, newGeoJSON);
    console.log("new map resistered");
}

/////////////////////////////////////////////////////////////////////
// select farm
/////////////////////////////////////////////////////////////////////
function sendMaps() {
    fs.readdir('public/map', (err, files) => { 
        if (err || files.length == null) return;
        files.forEach(function (file) {
            const json = JSON.parse(fs.readFileSync('public/map/' + file, 'utf8'));
            io.emit('latlng', json.coordinates);
        })
    })
}

/////////////////////////////////////////////////////////////////////
// set beacon
/////////////////////////////////////////////////////////////////////
var beaconNum;
var beaconsState = [beaconNum];
var mapNum;
var routes = []; // [[index, beacon_address, beacon_lat, beacon_lng], ...]

function setMap(json) {
    console.log(beaconNum);
    io.emit('beaconNum', beaconNum);
    for (let i = 0; i < beaconNum; i++) {
        io.emit('deviceLoc', [json[i].x, json[i].y]);
        routes.push([i, json[i].name, json[i].x, json[i].y]);
        console.log(routes[i]);
    }
}

function setMapNum(data) {
    mapNum = data;
}

function sendMapLatLng() {
    fs.readdir('public/map', (err, files) => { 
        if (err || files.length == null) return;
        files.forEach(function (file) {
            var filename = "map" + mapNum + ".geojson";
            if (file == filename) {
                const json = JSON.parse(fs.readFileSync('public/map/' + file, 'utf8'));
                console.log(json.coordinates);
                io.emit('maplatlng', json.coordinates);
            }
        })
    })
}

function sendBeacons() {
    let beaconsJSON = JSON.parse(fs.readFileSync(("./public/beacons/map" + mapNum + "/data.json"), 'utf8'));
    beaconNum = beaconsJSON.length;

    setMap(beaconsJSON);
}

function addBeacon(posNameAddress) {
    let filename = "./public/beacons/map" + mapNum + "/data.json";
    let preData = fs.readFileSync(filename, 'utf8');
    beaconNum = JSON.parse(preData, 'utf8').length;

    console.log(posNameAddress);

    let newData;
    if (beaconNum == 0) newData = '{"id": ' + (beaconNum + 1) + ', "name": "' + posNameAddress[2] + '", "address": "' + posNameAddress[3] + '","x": ' + posNameAddress[0] + ', "y": ' + posNameAddress[1] + '}]';
    else newData = ',{"id": ' + (beaconNum + 1) + ', "name": "' + posNameAddress[2] + '", "address": "' +  posNameAddress[3] + '","x": ' + posNameAddress[0] + ', "y": ' + posNameAddress[1] + '}]';
    preData = preData.slice(0, -1);
    let data = preData + newData;
    fs.writeFileSync(filename, data);
    beaconNum ++;

    //setMap(JSON.parse(fs.readFileSync(filename, 'utf8')));
    jsonObject = JSON.parse(data, 'utf8');
    noble.stopScanning();
}


/////////////////////////////////////////////////////////////////////
// noble
/////////////////////////////////////////////////////////////////////
const noble = require('noble-winrt');

// log file
require('date-utils');
let now = new Date();
const logfile = 'log/' + now.toFormat('YYYY-M-D-HH24-MI-SS.csv');

fs.writeFile(logfile, '', function (err) {
    if (err) { throw err; }
    console.log(logfile);
});

function writeLog (data) {
    fs.appendFile(logfile, data + '\n', (err) => {
        if (err) throw err;
    })
}

// set routes (order beacons)
// var routes = []; // [[index, beacon_address, beacon_lat, beacon_lng], ...]
var nowBeacon; // now beacon index
function pushBeaconToRoutes(lat_lng) {
    let beaconsJSON = JSON.parse(fs.readFileSync(("./public/beacons/map" + mapNum + "/data.json"), 'utf8'));
    var num = 1;
    for (let i = 0; i < beaconNum; i++) {
        if (beaconsJSON[i].x == lat_lng[0] && beaconsJSON.y == lat_lng[1]) {
            routes.push([i, beaconsJSON[i].name, beaconsJSON[i].x, beaconsJSON[i].y]);
            console.log("add routes: " + num);
            num++;
        }
    }
}

const LAT = 0;
const LNG = 1;
function haversineDistance(mk1, mk2) {
    var R = 6371.0710; // Radius of the Earth in km
    var rlat1 = mk1[LAT] * (Math.PI/180);
     // Convert degrees to radians
    var rlat2 = mk2[LAT] * (Math.PI/180);
     // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (mk2[LNG] - mk1[LNG]) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R 
    * Math.asin(Math.sqrt(Math.sin(difflat/2) * Math.sin(difflat/2)
    + Math.cos(rlat1) * Math.cos(rlat2)
    * Math.sin(difflon/2) * Math.sin(difflon/2)));
    return 1000 * d;
  }

function calcSelfPos(rssi) {
    var b1 = [routes[nowBeacon][2], routes[nowBeacon][3]];          // [lat, lng]
    var b2 = [routes[nowBeacon + 1][2], routes[nowBeacon + 1][3]];  // [lat, lng]
    var d = haversineDistance(b1, b2);
    var r = Math.pow(10.0, (tx - rssi)/20);  // model of distance with RSSI
    return [b1[0] + (r/d*(b2[0] - b1[0])), b1[1] + (r/d*(b2[1] - b1[1]))];
}

// poximity detection
var proximityJudgment = 0;          // resister beacion = 0 or priximity judgement = 1
const proximityJudgmentValue = -60; //threshold
const timeInterval = 500;           // time interval to get RSSI
const tx = -67;                     //TxPower
const DISCOVERED = 1;
const UNDISCOVERED = 0;
var previousTime;
var jsonObject;
var beacons = [];

let checkName = (name, index) => {
    return (routes[index][1] == name) ? 1 : 0;
}

let check = (address, rssi) => {
    // resister beacon
    if (proximityJudgment == 0) {
        if (rssi > proximityJudgmentValue && ! beacons.includes(address)) {
            beacons.push(address);
            return 0;
        }
    }
    //proximity judgement
    // else {
    //     const t = now.getTime();
    //     for (let i = 0; i < beaconNum; i++) {
    //         if (jsonObject[i].name == address) {
    //             // if (previousTime == t) break;
    //             writeLog(now.toFormat('HH24:MI:SS') + "," + address + ',' + rssi);
    //             previousTime = t;
    //             if (rssi > proximityJudgmentValue && beaconsState[i]== UNDISCOVERED) {
    //                 beaconsState[i]= DISCOVERED;
    //                 return i;
    //             }
    //         }
    //     }
    // }
    else {
        if (address != routes[nowBeacon][1] && address != routes[nowBeacon + 1][1]) return;
        const t = now.getTime();
        writeLog(now.toFormat('HH24:MI:SS') + "," + address + "," + rssi);
        const index = routes[nowBeacon][0];
        if (address == routes[nowBeacon + 1][1] && rssi > proximityJudgmentValue) {
            nowBeacon ++;
        }
        if (beaconsState[index] == UNDISCOVERED) {
            beaconsState[index] = DISCOVERED;
            return index;
        }
        // if (rssi > proximityJudgmentValue && beaconsState[index] == UNDISCOVERED) {
        //    beaconsState[index] = DISCOVERED;
        //    return index;
        // }
    }
    return -1;
}

let discovered = (peripheral) => {
    let device = {
        name: peripheral.advertisement.localName,
        uuid: peripheral.uuid,
        rssi: peripheral.rssi,
        address: peripheral.address
    };
    if (proximityJudgment == 1 && checkName(device.name, nowBeacon) == 1) {
        var selfPos = calcSelfPos(device.rssi);
        io.emit('selfPos', selfPos);
    }

    let index = check(device.name,device.rssi);
    if (index >= 0) {
        io.emit('address', index);
        io.emit('beaconData', [device.name, device.address]);
    }
}

function scan() {
    now = new Date();
    noble.startScanning();
    noble.on('discover', discovered);
}

function scanStart() {
    for (let i = 0; i < beaconNum; i++) beaconsState[i] = 0;
    let filename = "./public/beacons/map" + mapNum + "/data.json";
    let data = fs.readFileSync(filename, 'utf8');
    jsonObject = JSON.parse(data, 'utf8');
    setInterval(scan, timeInterval);
}

function nobleOn(isProximityJudgement) {
    if (isProximityJudgement) {
        proximityJudgment = 1;
        nowBeacon = 0;
    }
    if(noble.state === 'poweredOn'){
        scanStart();
    } else {
        noble.on('stateChange', scanStart);
    }
}

function nobleOff() {
    noble.stopScanning();
    console.log("stop noble");
}

/////////////////////////////////////////////////////////////////////
// new connection
/////////////////////////////////////////////////////////////////////

function newConnection(socket) {
    console.log('new connection: ' + socket.id);

    socket.on('marker', addMap);
    socket.on('openMapSelectPage', sendMaps);
    socket.on('mapNum', setMapNum);
    socket.on('openBeaconPage', sendMapLatLng);
    socket.on('mapReady', sendBeacons);
    socket.on('newBeacon', nobleOn);
    socket.on('setBeacon', addBeacon);
    socket.on('setmap', setMap);
    socket.on('openRoutesPage', sendMapLatLng);
    socket.on('pushBeaconToRoutes', pushBeaconToRoutes);
    socket.on('noble', nobleOn);
    socket.on('stopNoble', nobleOff);
}

console.log("server and noble are running");
io.sockets.on('connection', newConnection);