import { NextFunction, Request, Response } from 'express'
import { urlStatsDbHelper } from '../db/helpers'
import { UrlStats } from '../db/entities/UrlStats'
import { User } from '../db/entities/User'
import { UserRole } from '../db/entities/UserRole'
import { Response403Error, Response500Error } from './ResponseError'
import jwt from 'jsonwebtoken'

const TOKEN_KEY = '111111'

const SA: User = {
    id: 'SA',
    email: 'sa@sa.sa',
    name: 'Super Admin',
    role: UserRole.SuperAdmin,
    token: 'mhvXdrZT4jP5T8vBxuvm75'
}

const GUEST: User = {
    id: 'GUEST',
    email: 'guest@guest.guest',
    name: 'Guest User',
    role: UserRole.Guest,
    token: 'No-Password-Required'
}

export enum UserActions {
    MinifyUrl = "minify-url",
    RedirectUrl = "redirect-url",
    StatsByUrl = "stats-by-url",
    StatsByUser = "stats-by-user",
    AllStats = "all-stats"
}

export type LoginUser = {
    id: string;
    email: string;
    role: UserRole;
}

export type AuthUser = LoginUser & { isAuthenticated: boolean, isAllowed: (op: UserActions) => boolean }

const permissions: { [key in keyof typeof UserRole]?: Array<UserActions>} = {
    Guest: [
        UserActions.MinifyUrl,
        UserActions.RedirectUrl,
    ],
    Normal: [
        UserActions.MinifyUrl,
        UserActions.RedirectUrl,
        UserActions.StatsByUrl,
        UserActions.StatsByUser,
    ],
    Admin: [
        UserActions.MinifyUrl,
        UserActions.RedirectUrl,
        UserActions.StatsByUrl,
        UserActions.StatsByUser,
    ],
    SuperAdmin: [
        UserActions.MinifyUrl,
        UserActions.RedirectUrl,
        UserActions.StatsByUrl,
        UserActions.StatsByUser,
        UserActions.AllStats,
    ]
}

const decodeToken = (tokenKey: string, req: Request, next: NextFunction): Partial<User> => {
    let authUser: Partial<User> = undefined
    try {
        if (!req.headers.authorization) {
            authUser = GUEST
        } else {
            const base64Auth = (req.headers.authorization || '').split(' ')[1] || ''
            const [key, authToken] = Buffer.from(base64Auth, 'base64').toString().split(':')
            authUser = jwt.verify(authToken, tokenKey) as Partial<User>    
        }
    } catch (ex) {
        next(new Response500Error(ex.message))
    }
    return authUser
}

const auth = async (req: Request, res: Response, next: NextFunction): Promise<AuthUser> => {
    const { id } = req.params
    const authUser = decodeToken(TOKEN_KEY, req, next)
    // if (!authUser) return

    // let user: User
    // if (authUser.id === SA.id && authUser.email === SA.email) {
    //     user = SA
    // } else if (authUser.role == UserRole.Guest) {
    //     user = GUEST
    // }
    return {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        isAuthenticated: authUser !== undefined,
        isAllowed: (op: UserActions) => {
            let { userId } = req.params
            if (userId && authUser.role === UserRole.Normal) {
                return false
            }
            const roleKey = UserRole.GetKey(authUser.role)
            const permissionSet = permissions[roleKey]
            return permissionSet.includes(op)
        }
    }
}

export const authWrapper = (op: UserActions, handler: (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authResult = await auth(req, res, next)
        if (!authResult) {
            return
        }
        if (authResult.isAuthenticated && authResult.isAllowed(op)) {
            await handler(authResult, req, res, next)
        } else {
            throw new Response403Error(`'${authResult.email}' is not allowed operation(s) '${op}'`)
        }
    }
}