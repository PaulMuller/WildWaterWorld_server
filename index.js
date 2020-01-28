const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const config = require('./config.json')


class Player{
    static connectedPlayers = []

    constructor(address, socketId){
        //...
        //find in db and load or create new in db
        //...

        this.address = address
        this.socketId = socketId
        this.x = 0
        this.y = 0
        this.rotation = 0
        this.speed = 0
        this.speedCoeficient = 0.6
        this.turnSpeed = 0
        this.viewRadius = 500
        this.inGame = false

        connectedPlayers.push(this)
        console.log("client connected")
    }

    disconnect(){
        let index = connectedPlayers.indexOf(this)
        if (index !== -1) connectedPlayers.splice(index, 1)
        console.log(`client disconnected`)
    }

    move() {
        this.x += Math.cos(this.rotation) * this.speed * this.speedCoeficient
        this.y += Math.sin(this.rotation) * this.speed * this.speedCoeficient
        this.rotation += this.turnSpeed * this.speed * this.speedCoeficient
    }

    getVisiblePlayers(){
        let visiblePlayers = []

        Player.connectedPlayers.forEach( player => {
            if (this.socketId == player.socketId) return
            let distance = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2)
            if (distance <= this.viewRadius) visiblePlayers.push(player)
        })
    
        return visiblePlayers || []
    }

    static moveAll(){
        this.connectedPlayers.forEach( player => player.move())
    }

}




io.on('connection', client => { 
    const currentPlayer = new Player(`TUFEL9h9zN8KNMwRgcTxd9jDXUU3E8Kwbx`, client.id)//player initialization on start (load from db or register new)

    let playerState = [
        currentPlayer.x,
        currentPlayer.y,
        currentPlayer.rotation,
        currentPlayer.viewRadius,
    ].map( i => ~~(i * 1e4))

    client.on( 1, ping => client.emit(1, [ping, ...playerState]))
    client.on('AUP', () => currentPlayer.speed < 3 && currentPlayer.speed++)
    client.on('ADP', () => currentPlayer.speed > -1 && currentPlayer.speed--)
    client.on('ARP', () => currentPlayer.turnSpeed = 0.02)
    client.on('ALP', () => currentPlayer.turnSpeed = -0.02)
    client.on('ARR', () => currentPlayer.turnSpeed = 0)
    client.on('ALR', () => currentPlayer.turnSpeed = 0) 
    client.on("disconnect", () => currentPlayer.disconnect())
    
});

(() => {
    http.listen(config.port, () => console.log(`Game server started at port ${config.port}`))
        
    setInterval(() => {
        Player.moveAll()
    }, 33)
})()

