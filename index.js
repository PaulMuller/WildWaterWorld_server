const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const config = require('./config.json')
const islands = require('./islands.json')

class Player{
    constructor(address, socketId){
        this.address = address
        this.socketId = socketId
        this.x = 0
        this.y = 0
        this.rotation = 0
        this.speed = 0
        this.speedCoeficient = 0.6
        this.turnSpeed = 0
        this.viewRadius = 500
    }

    move() {
        this.x += Math.cos(this.rotation) * this.speed * this.speedCoeficient
        this.y += Math.sin(this.rotation) * this.speed * this.speedCoeficient
        this.rotation += this.turnSpeed * this.speed * this.speedCoeficient
    }
}

const main = () => {
    setInterval(() => {
        
    }, 33);



}

main()






io.on('connection', client => { 
    console.log("player connected to game server!");

    players[client.id] = Object.assign({},newPlayerTemplate);

    setInterval(() => {
        client.emit(2, {//playerUpdate
            player :players[client.id],
            otherVisiblePlayers: getVisiblePlayers(client.id),
            islands: islands
        });
    }, 33);

    client.on(1, (data)=>{//ping
        client.emit(1, data);
    });

    client.on("ArrowUp_pressed", () => {
        if (players[client.id].speed < 3)
            players[client.id].speed ++;
    });
    client.on("ArrowDown_pressed", () => {
        if (players[client.id].speed >-1)
            players[client.id].speed --;
    });
    client.on("ArrowRight_pressed", () => {
        players[client.id].turnSpeed = 0.02; 
    });
    client.on("ArrowLeft_pressed", () => {
        players[client.id].turnSpeed = -0.02; 
    });
    
    client.on("ArrowUp_released", () => {
        // player.speed = 0;
    });
    client.on("ArrowDown_released", () => {
        // player.speed = 0;
    });
    client.on("ArrowRight_released", () => {
        players[client.id].turnSpeed = 0; 
    });
    client.on("ArrowLeft_released", () => {
        players[client.id].turnSpeed = 0; 
    });


    client.on("disconnect", () => {
        delete players[client.id];
        console.log("player disconnected from game server");
    });
});

http.listen(config.port, () => {
    console.log('Game server start at port: ', config.port);
});

const getVisiblePlayers = (clientId) => {
    if (players[clientId] == undefined) return {};
    let res = {};

    Object.keys(players).forEach(socketId => {
        if (clientId == socketId) return;
        
        let distance = Math.sqrt((players[socketId].x - players[clientId].x)**2 + (players[socketId].y - players[clientId].y)**2);

        if (distance <= players[clientId].viewRadius){
            res[socketId] = players[socketId];
        }
        
    });

    return res;
}

function move(object, speedCoeficient) {
	object.x = +( object.x + object.speed * speedCoeficient * Math.cos(object.rotation) ).toFixed(5);
	object.y = +( object.y + object.speed * speedCoeficient * Math.sin(object.rotation) ).toFixed(5);
    object.rotation = +( object.rotation + object.turnSpeed * object.speed * speedCoeficient ).toFixed(5);
}


function arrayRemove(arr, value) {
    let index = arr.indexOf(value);
    if (index !== -1) arr.splice(index, 1);
    return arr;
}
