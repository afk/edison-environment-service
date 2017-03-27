var api = require('./api');

var express = require('express');
var app = express();

var path = require('path');

var credentials = require('./credentials')

var username = credentials.username;
var password = credentials.password;

var accountId = credentials.accountId;

var ready = false;
var apiToken = null;
var devices = [];
var components = [];

/**
 * Get Api token and start the server afterwards
 */
api.auth.getToken(username, password, function(err, response){
    if(err) throw err

    ready = true;
    apiToken = response.token;


    // It's a Hackathlon! it doesn't need to be perfect. Quote: Steven!
    api.device.getDeviceList(accountId, apiToken, function(error, response) {
        // store the devices locally - it's a hack!
        devices = response.map(function (device) {
            return {deviceId: device.deviceId, name: device.name}
        });

        // get a component list
        response.forEach(function (el) {
            el.components.forEach(function (component) {
                components.push({
                    id: component.cid,
                    name: component.name
                })
            });
        });

        // And launch the magic!
        launchServer();
    })

});

/**
 * Get historical data from the API
 *
 * @param apiToken
 * @param params
 * @param callback
 */
function getData(apiToken, params, callback) {
    var localDevices = params.devices ? [params.devices] : null;
    var localComponents = params.component ? [{id: params.component, op: "none"}] : null;

    // If the request doesn't have parameters for device, then use all devices
    if (!localDevices) {
        localDevices = devices.map((device) => device.deviceId);
    }

    // Use all components if the request doesn't specify a component
    if (!localComponents) {
        localComponents = components.map((component) => ({id: component.id, op: "none"}));
    }

    var data = {
        "from": parseInt( params.start),
        "to": parseInt(params.end),
        "targetFilter": {
            "deviceList": localDevices
        },
        "metrics": localComponents
    };

    // Retrieve the data from the server and execute our call back
    api.data.retrieveData(accountId, data, apiToken, function(error, response) {
        return callback(error, response);
    });
}

/**
 * Start the magical express server!
 */
function launchServer() {
    // For the hackatlon we need to go around CORS
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/index.html'));
    });

    app.get('/index.js', function(req, res) {
        res.sendFile(path.join(__dirname + '/index.js'));
    });

    app.get('/css/style.css', function(req, res) {
        res.sendFile(path.join(__dirname + '/css/style.css'));
    });

    app.get('/devices', function (req, res) {
        api.device.getDeviceList(accountId, apiToken, function(apiError, apiResponse) {
            res.json(apiResponse);
        });
    });

    app.get('/components', function (req, res) {
        api.component.getComponentList(accountId, apiToken, function(apiError, apiResponse) {
            res.json(apiResponse);
        });
    });

    app.get('/data', function(req, res) {
        getData(apiToken, req.query, function(error, points) {
                res.json(points);
            });
    });


    app.listen(80, function () {
        console.log('Edison Environment server is listening 8082!');
    });
}
