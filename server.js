const express = require('express')
const http = require('http');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');


var httpPort = 8080;
var httpsPort = 0;

const app = express();
app.use(express.static('web'));

var ws = null;
var wss = null;

if (httpPort != 0) {
    const httpServer = http.createServer(app);
    httpServer.listen(httpPort, () => console.log("HTTP/Websocket server listening on: http://127.0.0.1:" + httpPort));
    ws = RegisterWebSocketEvents(new WebSocket.Server({
        server: httpServer
    }), "Non-Secure Websocket connected.");
}

if (httpsPort != 0) {
    const httpsServer = https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app);
    httpsServer.listen(httpsPort, () => console.log("HTTPS/Secure Websocket server listening on: https://127.0.0.1:" + httpsPort))
    wss = RegisterWebSocketEvents(new WebSocket.Server({
        server: httpsServer
    }), "Secure Websocket connected.");
}

function RegisterWebSocketEvents(wss, connectMsg) {
    wss.on('connection', (ws) => {
        OnConnection(ws, connectMsg);
    });
    wss.on('close', OnClose);
    return wss;
}

function OnConnection(wsclient, msg) {
    console.log(msg);

    wsclient.on('message', (msg) => {

        var obj = JSON.parse(msg);
        console.log('received: %s', msg);

        if (obj.cmd == "selectroom") {
            console.log('set room = ' + obj.room);
            wsclient.room = obj.room.toLowerCase();
        } else if (wsclient.room != null) {
            SendToAll(msg, wsclient);
        }
    });
}

function OnClose(wsclient) {
    console.log('client closed');
}

function SendToAll(msg, wsclient) {
    if (ws) {
        ws.clients.forEach(function each(client) {
            if (client != wsclient && client.room == wsclient.room) {
                client.send(msg);
            }
        });
    }
    if (wss) {
        wss.clients.forEach(function each(client) {
            if (client != wsclient && client.room == wsclient.room) {
                client.send(msg);
            }
        });
    }
}