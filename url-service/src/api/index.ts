import { urlencoded, json } from 'body-parser'
import express from 'express'
import { minifyUrl, redirectUrl, allStats, statsForUser, statsForUrl } from './urlStats'
import { authWrapper, UserActions } from './auth'
import { wwwPort } from '../env'
import { ResponseError } from './ResponseError'

const app = express()
app.use(urlencoded({ extended: true }))
app.use(json())

app.get("/ping", (req, res) => {
    res.write("pong")
    res.status(200)
    res.end()
})

app.post("/url/minify", authWrapper(UserActions.MinifyUrl, minifyUrl))
app.get("/r/:token", redirectUrl)
app.get("/url/stats", authWrapper(UserActions.AllStats, allStats))
app.post("/url/stats", authWrapper(UserActions.StatsByUrl, statsForUrl))
app.get("/url/stats/user/:userId", authWrapper(UserActions.StatsByUser, statsForUser))

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let message: string, statusCode: number
    if (!(err instanceof ResponseError)) {
        message = 'Internal Server Error'
        statusCode = 500
    } else {
        message = err.message
        statusCode = err.statusCode
    }
    if (res.headersSent) {
        return next(err)
    }
    res.status(statusCode)
    res.write(JSON.stringify({ message }))
    console.log(`Error found: `, err)
    res.end()
})

app.listen(wwwPort, () => {
    console.log(`App is listening on port ${wwwPort}`)
})