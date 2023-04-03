import express, {
    NextFunction,
    Request,
    Response
} from 'express'
import 'express-async-errors'
import { client } from './client'

const app = express()

app.use((err: any, _: Request, res: Response, next: NextFunction) => {
    res.sendStatus(500).end()
    console.error(err)
    next(err)
})

app.get('/interactions/sync-commands', async (_: Request, res: Response) => {
    await client.syncCommands()
    res.sendStatus(200).end()
})

app.post('/interactions', client.handlers)

app.listen(parseInt(process.env.PORT!))
