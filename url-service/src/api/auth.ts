import { NextFunction, Request, Response } from 'express'
import { urlStatsDbHelper } from '../db/helpers'
import { UrlStats } from '../db/entities/UrlStats'
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

const auth = async (req: Request, res: Response): Promise<AuthUser> => {
    const base64Auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [key, authToken] = Buffer.from(base64Auth, 'base64').toString().split(':')
    const authUser = jwt.verify(authToken, TOKEN_KEY) as Partial<User>

    let user: User
    if (authUser.id === SA.id && authUser.email === SA.email) {
        user = SA
    }
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        isAuthenticated: authUser !== undefined,
        isAllowed: (op: UserActions) => {
            let { userId } = req.params
            if (userId && user.role === UserRole.Normal) {
                return false
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