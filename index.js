require('dotenv').config()
const app       = require('express')()
const http      = require('http').Server(app)
const io        = require('socket.io')(http,{
    cors: {
        'origin': process.env.client,
        'access-control-allow-origin':process.env.client,
        'methods': ["GET", "POST"]
    }}
)
const config    = require('./config.json')


class Player{
    static connectedPlayers = []

    constructor(address, nickName, socket){
        
        //find in db and load or create new in db

        this.address = address
        this.nickName = nickName
        this.socketId = socket.id
        this.x = 0
        this.y = 0
        this.rotation = 0
        this.speed = 0
        this.speedCoeficient = 0.6
        this.turnSpeed = 0
        this.viewRadius = 1000
        this.inGame = false
        this.updateIntervalId = setInterval(() => io.to(this.socketId).emit( 2, [...this.playerState, this.visiblePlayers]), 33)

        Player.connectedPlayers.push(this)
        console.log(`client connected: ${this.address.slice(0,4)}...`)
    }

    get playerState(){
        return [
            this.x.toFixed(3),
            this.y.toFixed(3),
            this.rotation.toFixed(3),
            this.viewRadius.toFixed(3)
        ]
    }

    get visiblePlayers(){
        let arr = []

        Player.connectedPlayers.forEach( player => {
            if (this.address === player.address) return
            let distance = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2)
            if (distance <= this.viewRadius) arr.push([
                player.x.toFixed(3),
                player.y.toFixed(3),
                player.rotation.toFixed(3),
                player.nickName
            ])
        })
        return arr
    }

    async disconnect(){
        await new Promise(resolve => setTimeout(resolve, 15000))
        if (this.inGame) return console.log(`reconnected`)

        for(let i in Player.connectedPlayers){
            if(Player.connectedPlayers[i].address === this.address){
                Player.connectedPlayers.splice(i, 1)
                break
            }
        }
        clearInterval(this.updateIntervalId)
        console.log(`client disconnected: ${this.address.slice(0,4)}...`)
    }

    move() {
        const speed = this.speed * this.speedCoeficient
        this.x          += speed * Math.cos(this.rotation)
        this.y          += speed * Math.sin(this.rotation)
        this.rotation   += speed * this.turnSpeed
    }

    static moveAll(){
        Player.connectedPlayers.forEach(player => player.move())
    }
}

(() => {
    app.get("/", (request, response) => {
        response.send(`<h1>Hi there, server is UP for ${process.env.client}</h1>`);
    });

    http.listen(process.env.port, () => console.log(`Game server started at port ${process.env.port}`))
    let len = Player.connectedPlayers.length
    
    setInterval(() => {
        if (len != Player.connectedPlayers.length) {len = Player.connectedPlayers.length; console.log(len, Player.connectedPlayers.length)}
        Player.moveAll()
    }, 33)
})()


io.on('connection', client => { 
    let currentPlayer 

    client.on( 'in', data => {
        let findedPlayer = Player.connectedPlayers.filter(e => e.address === data[0])
        if (findedPlayer.length === 1){
            //player still in game
            findedPlayer[0].socketId = client.id
            findedPlayer[0].inGame = true
            currentPlayer = findedPlayer[0]
        }else{
            currentPlayer = new Player(data[0], data[1].nickName, client)//player initialization on start (load from db or register new)
            currentPlayer.inGame = true
        }
    })

    client.on( 1, ping => client.emit(1, ping))
    client.on( 3, e => {
        if (!currentPlayer || !currentPlayer.inGame) return
        switch (e[0]) {
            case 38:
                currentPlayer.speed < 3 && e[1] === 'keydown' ?  currentPlayer.speed++ : void(0)
                break
            case 40:
                currentPlayer.speed > -1 && e[1] === 'keydown' ?  currentPlayer.speed-- : void(0)
                break
            case 39:
                currentPlayer.turnSpeed = e[1] === 'keydown' ? 0.02 : 0
                break
            case 37:
                currentPlayer.turnSpeed = e[1] === 'keydown' ? -0.02 : 0
                break
            case 27:
                client.emit('out')
                currentPlayer.inGame = false
                break
        }
    }) 
    
    client.on('disconnect', () => {
        client.emit('out')
        if(currentPlayer){
            currentPlayer.inGame = false
            currentPlayer.disconnect()
        }
    })
})



