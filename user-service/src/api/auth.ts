import { NextFunction, Request, Response } from 'express'
import { userDbHelper } from '../db/helpers'
import { User } from '../db/entities/User'
import { UserRole } from '../db/entities/UserRole'
import { Response403Error } from './ResponseError'
import jwt from 'jsonwebtoken'

const TOKEN_KEY = '111111'

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

export type LoginUser = {
    id: string;
    email: string;
    role: UserRole;
}

export type AuthUser = LoginUser & { isAuthenticated: boolean, isAllowed: (op: UserActions) => boolean }

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

const auth = async (req: Request, res: Response): Promise<AuthUser> => {
    const { id } = req.params
    const base64Auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [key, authToken] = Buffer.from(base64Auth, 'base64').toString().split(':')
    const authUser = jwt.verify(authToken, TOKEN_KEY) as Partial<User>

    let user: User
    if (authUser.id === SA.id && authUser.email === SA.email) {
        user = SA
    } else {
        user = await userDbHelper.getUserByEmail(authUser.email) as User
    }
    return {
        id: user.id,
        email: user.email,
        role: user.role,
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

export const authWrapper = (op: UserActions, handler: (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authResult = await auth(req, res)
        if (authResult.isAuthenticated && authResult.isAllowed(op)) {
            await handler(authResult, req, res, next)
        } else {
            throw new Response403Error(`'${authResult.email}' is not allowed operation(s) '${op}'`)
        }
    }
}

export const createAuthToken = async (email: string, token: string) => {
    let user: User
    if (email === SA.email && token === SA.token) {
        user = SA
    } else {
        const userData = await userDbHelper.getUserByEmail(email) as User
        if (userData.token === token) {
            user = userData
        }
    }
    if (user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        return jwt.sign(payload, TOKEN_KEY, {
            expiresIn: '2h'
        })    
    }
}

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlNBIiwiZW1haWwiOiJzYUBzYS5zYSIsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNjMyMjEwMjEyLCJleHAiOjE2MzIzODMwMTJ9.8g3s33y-Uc82-HVX6CzkCs1OG0XVLtcj65G1MBfTkQA
// jaya.chaudhary@gmail.com : h7BXEeunBqef9aCV66167H