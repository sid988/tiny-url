import { urlencoded, json } from 'body-parser'
import express from 'express'
import { addUser, findUser, findUsers, updateUser, deleteUser } from './users'
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

app.post("/users", authWrapper(UserActions.AddUser, addUser))
app.post("/users/search", authWrapper(UserActions.ListUsers, findUsers))
app.get("/user/:id", authWrapper(UserActions.ViewUser, findUser))
app.patch("/user/:id", authWrapper(UserActions.UpdateUser, updateUser))
app.delete("/user/:id", authWrapper(UserActions.DeleteUser, deleteUser))

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