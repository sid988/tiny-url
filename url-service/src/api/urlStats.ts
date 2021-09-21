import { NextFunction, Request, Response } from 'express'
import { UrlStats } from '../db/entities/UrlStats'
import { urlStatsDbHelper } from '../db/helpers'
import { wwwPath } from '../env'
import { Response403Error, Response404Error, Response500Error } from './ResponseError'
import short from 'short-uuid'
import { LoginUser } from './auth'
import { UserRole } from '../db/entities/UserRole'

// const userExistsForId = async (user: Partial<User>) => {
//     let userForId = await userDbHelper.getUser(user.id)
//     if (userForId) return true

//     return false
// }

// const userExistsForName = async (user: Partial<User>) => {
//     let userForName = await userDbHelper.getUsers({ name: user.name })
//     if (userForName.length > 0) return true

//     return false
// }

const statsExistsForUrlAndUserId = async (urlStats: Partial<UrlStats>) => {
    let urlStatsData = await urlStatsDbHelper.getStats(urlStats.url, urlStats.userId) as UrlStats
    if (urlStatsData) {
        urlStats.minifyCount = urlStatsData.minifyCount
        urlStatsData.redirectCount = urlStatsData.redirectCount
    }

    return urlStats
}

const validateSchema = async (urlStats: Partial<UrlStats>, flags: Partial<{ [key in keyof UrlStats]: { type?: string, required?: boolean, possibleValues?: Array<string> } }>, isExactSchema: boolean = false) => {
    const keys: Array<keyof UrlStats> = [ "url", "userId", "minifyCount", "redirectCount" ]
    if (isExactSchema) {
        const unwantedKeys = Object.getOwnPropertyNames(urlStats).filter(key => {
            return !Object.getOwnPropertyNames(flags).includes(key)
        }).join('\', \'')
        if (unwantedKeys.length > 0) {
            throw new Response500Error(`Expected an exact match, found unwanted keys '${unwantedKeys}'`)
        }
    }
    for(const key of keys) {
        if (flags[key] && flags[key].required && !urlStats[key]) {
            throw new Response500Error(`Missing parameter '${key}'`)
        }
        if (flags[key] && flags[key].type && urlStats[key] && typeof urlStats[key] !== flags[key].type) {
            throw new Response500Error(`Invalid schema for parameter 'name'`)        
        }
        if (flags[key] && flags[key].possibleValues && urlStats[key] && !flags[key].possibleValues.includes(urlStats[key] as string))
            throw new Response500Error(`Invalid schema for parameter 'passionLevel', value should be one of ${flags[key].possibleValues}`)
    }
}

const generateToken = () => {
    const translator = short(short.constants.flickrBase58, {
        consistentLength: false
    })
    return translator.new().toString()
}

export const minifyUrl = async (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => {
    try {
        const urlStats = req.body as UrlStats
        await validateSchema(urlStats, {
            url: { required: true, type: 'string' }
        }, true)
        urlStats.userId = loginUser.id
        let urlStatsData = await urlStatsDbHelper.getStats(urlStats.url, urlStats.userId) as UrlStats
        if (urlStatsData) {
            urlStats.minifyCount = urlStatsData.minifyCount + 1
            urlStats.redirectCount = urlStatsData.redirectCount
            urlStats.minifiedUrl = urlStatsData.minifiedUrl
            await urlStatsDbHelper.updateStats(urlStats)
        } else {
            urlStats.minifyCount = 1
            urlStats.redirectCount = 0
            urlStats.minifiedUrl = `${wwwPath}/r/${generateToken()}`
            await urlStatsDbHelper.addStats(urlStats)
        }
        res.json({
            url: urlStats.url,
            minifiedUrl: urlStats.minifiedUrl,
            minifyCount: urlStats.minifyCount,
            redirectCount: urlStats.redirectCount
        })
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const redirectUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const urlStats = { minifiedUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}` } as UrlStats
        let urlStatsData = await urlStatsDbHelper.getStatsForMinUrl(urlStats.minifiedUrl) as UrlStats
        if (!urlStatsData) {
            throw new Response404Error('No such shorterned url exists')
        } else {
            urlStats.minifyCount = urlStatsData.minifyCount
            urlStats.redirectCount = urlStatsData.redirectCount
            urlStats.url = urlStatsData.url
        }
        urlStats.redirectCount = urlStats.redirectCount + 1
        await urlStatsDbHelper.updateStats(urlStats)
        res.redirect(urlStats.url)
    } catch (ex) {
        next(ex)
    }
}

export const statsForUrl = async (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => {
    try {
        let { url } = req.body
        let urlStats = await urlStatsDbHelper.getStats(url, loginUser.id) as UrlStats
        if (!urlStats) {
            throw new Response404Error(`No such url '${url}' shortened yet`)
        }
        res.json({
            url: urlStats.url,
            userId: urlStats.userId,
            minifiedUrl: urlStats.minifiedUrl,
            minifyCount: urlStats.minifyCount,
            redirectCount: urlStats.redirectCount
        })
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const statsForUser = async (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => {
    try {
        let { userId } = req.params
        userId = userId || loginUser.id
        let urlStatsCollection = await urlStatsDbHelper.getStatsByUser(userId)
        if (urlStatsCollection && urlStatsCollection.length) {
            res.json(urlStatsCollection.map(urlStats => ({
                url: urlStats.url,
                userId: urlStats.userId,
                minifiedUrl: urlStats.minifiedUrl,
                minifyCount: urlStats.minifyCount,
                redirectCount: urlStats.redirectCount
            })))
        } else {
            res.json([])
        }
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const allStats = async (loginUser: LoginUser, req: Request, res: Response, next: NextFunction) => {
    try {
        let urlStatsCollection = await urlStatsDbHelper.getAllStats()
        if (urlStatsCollection && urlStatsCollection.length) {
            let userIds = new Set(urlStatsCollection.map(x => x.userId))
            let userWiseStats = {} as { [key: string]: Array<UrlStats> }
            for (const userId of userIds) {
                userWiseStats[userId] = urlStatsCollection.filter(x => x.userId === userId)
            }
            res.json(userWiseStats)
        } else {
            res.json([])
        }
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}