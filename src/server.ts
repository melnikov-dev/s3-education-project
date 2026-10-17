import 'dotenv/config'
import express, { type Application, type Request, type Response } from 'express'


export class Server {
    private readonly app: Application

    constructor() {
        this.app = express()
        this.configure()
    }

    private configure() {
        this.app.use(express.json())

        this.app.get('/ping', (req: Request, res: Response) => {
            res.status(200).send('pong');
        })
    }

    public start() {
        const port: number = Number(process.env.PORT)

        this.app.listen(port, () => {
            console.log(`Server is running on port: ${port}`)
        })
    }
}