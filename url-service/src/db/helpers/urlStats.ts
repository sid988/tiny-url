import { MongoClient, Collection, Document, InsertOneResult, UpdateResult, DeleteResult } from 'mongodb'
import { UrlStats } from '../entities/UrlStats'

const collectionName = 'UrlStats'
export const createUrlStatsDbHelper = (mongoDbUrl: string, dbName: string) => {
    const dbUrl = `${mongoDbUrl}/${dbName}`

    const connect = async (task: (collection: Collection<Document>) => void) => {
        let client: MongoClient
        try {
            client = await MongoClient.connect(dbUrl)
            const db = client.db(dbName)
            let collection = db.collection(collectionName)
            if (!collection) {
                collection = await db.createCollection(collectionName)
            }
            await task(collection)
        } finally {
            if (client) {
                client.close()
            }
        }
        
    }

    const addStats = async (stats: UrlStats) => {
        let result: InsertOneResult<Document>
        await connect(async collection => {
            result = await collection.insertOne(stats)
        })
        return result
    }

    const getStatsByUser = async (userId: string) => {
        let result: Array<UrlStats> = []
        await connect(async collection => {
            const cursor = await collection.find({ userId })
            await cursor.forEach((document: Document) => {
                result.push(document as UrlStats)
            })
        })
        return result
    }

    const getStatsByUrl = async (url: string) => {
        let result: Array<UrlStats> = []
        await connect(async collection => {
            const cursor = await collection.find({ url })
            await cursor.forEach((document: Document) => {
                result.push(document as UrlStats)
            })
        })
        return result
    }

    const getStats = async (url: string, userId: string) => {
        let result: Document
        await connect(async collection => {
            result = await collection.findOne({ url, userId })
        })
        return result
    }

    const getStatsForMinUrl = async (minifiedUrl: string) => {
        let result: Document
        await connect(async collection => {
            result = await collection.findOne({ minifiedUrl })
        })
        return result
    }

    const getAllStats = async () => {
        let result: Array<UrlStats> = []
        await connect(async collection => {
            const cursor = await collection.find()
            await cursor.forEach((document: Document) => {
                result.push(document as UrlStats)
            })
        })
        return result
    }

    type StatsFindQuery = {
        [key in keyof UrlStats]: string | number | {
            $regex?: string,
            $options?: string
        }
    }

    const getStatsByPattern = async (query: Partial<UrlStats>) => {
        let result: Array<UrlStats> = []
        await connect(async collection => {
            let findQuery: Partial<StatsFindQuery> = {}
            if (query.url) {
                findQuery.url = { $regex: query.url, $options: 'i' }
            }
            const cursor = await collection.find(findQuery)
            await cursor.forEach((document: Document) => {
                result.push(document as UrlStats)
            })
        })
        return result
    }

    const updateStats = async (stats: Partial<UrlStats>) => {
        const newValues = {
            $set: {
                ...(stats.minifyCount ? { minifyCount: stats.minifyCount } : {}),
                ...(stats.redirectCount ? { redirectCount: stats.redirectCount } : {})
            }
        }
        let result: UpdateResult
        await connect(async collection => {
            result = await collection.updateOne({ url: stats.url }, newValues)
        })
        return result
    }

    const deleteStats = async (url: string) => {
        let result: DeleteResult
        await connect(async collection => {
            result = await collection.deleteOne({ url })
        })
        return result
    }

    return { addStats, getStats, getStatsForMinUrl, getStatsByPattern, getStatsByUser, getStatsByUrl, getAllStats, updateStats, deleteStats }
}