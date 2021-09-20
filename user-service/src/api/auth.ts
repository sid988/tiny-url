import { NextFunction, Request, Response } from 'express'
import { userDbHelper } from '../db/helpers'
import { User } from '../db/entities/User'
import { UserRole } from '../db/entities/UserRole'
import { Response403Error } from './ResponseError'

const SA: User = {
    id: 'SA',
    email: 'sa@sa.sa',
    name: 'Super Admin',
    role: UserRole.SuperAdmin,
    token: 'mhvXdrZT4jP5T8vBxuvm75'
}

export enum UserActions {
    AddUser = "add-user",
    UpdateUser = "update-user",
    DeleteUser = "delete-user",
    ListUsers = "list-users",
    ViewUser = "view-user",
    UpdateRole = "update-role"
}

const permissions: { [key in keyof typeof UserRole]?: Array<UserActions>} = {
    Normal: [
        UserActions.ListUsers,
        UserActions.ViewUser,
    ],
    Admin: [
        UserActions.AddUser,
        UserActions.UpdateUser,
        UserActions.DeleteUser,
        UserActions.ListUsers,
        UserActions.ViewUser,
    ],
    SuperAdmin: [
        UserActions.AddUser,
        UserActions.UpdateUser,
        UserActions.DeleteUser,
        UserActions.ListUsers,
        UserActions.ViewUser,
        UserActions.UpdateRole,
    ]
}

const auth = async (req: Request, res: Response) => {
    const { id } = req.params
    const base64Auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [key, password] = Buffer.from(base64Auth, 'base64').toString().split(':')
    let user: User
    if (key === SA.email && password === SA.token) {
        user = SA
    } else {
        const userData = await userDbHelper.getUserByEmail(key)
        if (userData.token === password) {
            user = userData as User
        }
    }
    return {
        key,
        isAuthenticated: user !== undefined,
        isAllowed: (op: UserActions) => {
            if (id === user.id && (op === UserActions.UpdateUser || op === UserActions.ViewUser)) {
                return true
            }
            const roleKey = UserRole.GetKey(user.role)
            const permissionSet = permissions[roleKey]
            return permissionSet.includes(op)
        }
    }
}

export const authWrapper = (op: UserActions, handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authResult = await auth(req, res)
        if (authResult.isAuthenticated && authResult.isAllowed(op)) {
            await handler(req, res, next)
        } else {
            throw new Response403Error(`${authResult.key} is not allowed operation '${op}'`)
        }
    }
}