import { Server } from './server.js'

function startServer() {
    const server = new Server()
    server.start()
}

startServer();