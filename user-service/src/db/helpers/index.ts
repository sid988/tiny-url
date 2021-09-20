import { mongoDbUrl, dbName } from '../../env'
import { createUserDbHelper } from './users'

export const userDbHelper = createUserDbHelper(mongoDbUrl, dbName)