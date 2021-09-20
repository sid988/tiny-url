import { MongoClient, Collection, Document, InsertOneResult, UpdateResult, DeleteResult } from 'mongodb'
import { User } from '../entities/User'
import { UserRole } from '../entities/UserRole'

const collectionName = 'Users'
export const createUserDbHelper = (mongoDbUrl: string, dbName: string) => {
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

    const addUser = async (user: User) => {
        let result: InsertOneResult<Document>
        await connect(async collection => {
            result = await collection.insertOne(user)
        })
        return result
    }

    const getUserByEmail = async (email: string) => {
        let result: Document
        await connect(async collection => {
            result = await collection.findOne({ email })
        })
        return result
    }

    const getUser = async (id: string) => {
        let result: Document
        await connect(async collection => {
            result = await collection.findOne({ id })
        })
        return result
    }

    type UserFindQuery = {
        [key in keyof User]: string | number | {
            $regex?: string,
            $options?: string
        }
    }

    const getUsers = async (query: Partial<User>) => {
        let result: Array<User> = []
        await connect(async collection => {
            let findQuery: Partial<UserFindQuery> = {}
            if (query.name) {
                findQuery.name = { $regex: query.name, $options: 'i' }
            }
            const cursor = await collection.find(findQuery)
            await cursor.forEach((document: Document) => {
                result.push(document as User)
            })
        })
        return result
    }

    const updateUser = async (user: Partial<User>) => {
        const newValues = {
            $set: {
                ...(user.name ? { name: user.name } : {})
            }
        }
        let result: UpdateResult
        await connect(async collection => {
            result = await collection.updateOne({ id: user.id }, newValues)
        })
        return result
    }

    const deleteUser = async (id: string) => {
        let result: DeleteResult
        await connect(async collection => {
            result = await collection.deleteOne({ id })
        })
        return result
    }

    return { addUser, getUser, getUsers, updateUser, deleteUser, getUserByEmail }
}