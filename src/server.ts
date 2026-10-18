import 'dotenv/config'
import express, { type Application } from 'express'
import storageRouter from './routes/storage.js'


export class Server {
    private readonly app: Application

    constructor() {
        this.app = express()
        this.configure()
    }

    private configure() {
        this.app.use(express.json())

        this.app.use('/storage', storageRouter)
    }

    public start() {
        const port: number = Number(process.env.PORT)

        this.app.listen(port, () => {
            console.log(`Server is running on port: ${port}`)
        })
    }
}