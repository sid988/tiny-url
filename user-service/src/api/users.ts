import { NextFunction, Request, Response } from 'express'
import { User } from '../db/entities/User'
import { UserRole } from '../db/entities/UserRole'
import { userDbHelper } from '../db/helpers'
import { v1 } from 'uuid'
import { wwwPath } from '../env'
import { Response404Error, Response500Error } from './ResponseError'
import { Ref } from './Ref'
import short from 'short-uuid'

const userExistsForId = async (user: Partial<User>) => {
    let userForId = await userDbHelper.getUser(user.id)
    if (userForId) return true

    return false
}

const userExistsForName = async (user: Partial<User>) => {
    let userForName = await userDbHelper.getUsers({ name: user.name })
    if (userForName.length > 0) return true

    return false
}

const validateSchema = async (user: Partial<User>, flags: Partial<{ [key in keyof User]: { type?: string, required?: boolean, possibleValues?: Array<string> } }>, isExactSchema: boolean = false) => {
    const keys: Array<keyof User> = [ "id", "name", "email", "role" ]
    if (isExactSchema) {
        const unwantedKeys = Object.getOwnPropertyNames(user).filter(key => {
            return !Object.getOwnPropertyNames(flags).includes(key)
        }).join('\', \'')
        throw new Response500Error(`Expected an exact match, found unwanted keys '${unwantedKeys}'`)
    }
    for(const key of keys) {
        if (flags[key] && flags[key].required && !user[key]) {
            throw new Response500Error(`Missing parameter '${key}'`)
        }
        if (flags[key] && flags[key].type && user[key] && typeof user[key] !== flags[key].type) {
            throw new Response500Error(`Invalid schema for parameter 'name'`)        
        }
        if (flags[key] && flags[key].possibleValues && user[key] && !flags[key].possibleValues.includes(user[key] as string))
            throw new Response500Error(`Invalid schema for parameter 'passionLevel', value should be one of ${flags[key].possibleValues}`)
    }
}

const generateToken = () => {
    const translator = short(short.constants.flickrBase58, {
        consistentLength: false
    })
    return translator.new().toString()
}

export const addUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.body as User
        await validateSchema(user, {
            name: { required: true, type: 'string' },
            email: { required: true, type: 'string' },
            role: { required: true, type: 'string', possibleValues: UserRole.Values() },
        })
        if (await userExistsForName(user)) {
            throw new Response500Error(`User ${user.name} already exists.`)
        }
        user.id = v1()
        user.token = generateToken()
        await userDbHelper.addUser(user)
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: user.token,
            ref: `${wwwPath}/users/${user.id}`
        })
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const findUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const user = await userDbHelper.getUser(id)
        if (user) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ref: `${wwwPath}/users/${user.id}`
            })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const findUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.body as User
        await validateSchema(query, {
            name: { type: 'string' }
        })
        const users = await userDbHelper.getUsers(query)
        const responseData: Array<Ref<User>> = new Array()
        for (let i = 0; i < users.length; i++) {
            const user = users[i]
            responseData.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ref: `${wwwPath}/users/${user.id}`
            })
        }
        res.json(responseData)
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        delete req.body.role
        const user = { ...req.body as User, id }
        await validateSchema(user, {
            id: { required: true, type: 'string' },
            name: { required: false, type: 'string' },
            email: { required: false, type: 'string' },
        })
        const userIsFound = await userExistsForId({ id })
        if (userIsFound) {
            // TODO: Id exists check
            await userDbHelper.updateUser(user)
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ref: `${wwwPath}/users/${user.id}`
            })
            res.status(200)
            res.end()
        } else {
            new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const user = { ...req.body as User, id }
        await validateSchema(user, {
            id: { required: true, type: 'string' },
            role: { required: true, type: 'string', possibleValues: UserRole.Values() },
        }, true)
        const userIsFound = await userExistsForId({ id })
        if (userIsFound) {
            // TODO: Id exists check
            await userDbHelper.updateUser(user)
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ref: `${wwwPath}/users/${user.id}`
            })
            res.status(200)
            res.end()
        } else {
            new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const userIsFound = await userExistsForId({ id })
        if (userIsFound) {
            // TODO: Id exists check
            await userDbHelper.deleteUser(id)
            res.json({ id, message: "User has been deleted!" })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}
