import { mongoDbUrl, dbName } from '../../env'
import { createUrlStatsDbHelper } from './urlStats'

export const urlStatsDbHelper = createUrlStatsDbHelper(mongoDbUrl, dbName)