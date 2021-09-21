export const mongoDbUrl = process.env.MONGODB_URL || 'mongodb://user-db:27017'
export const dbName = process.env.DBNAME || 'local'
const wwwProtocol = process.env.WWWPROTOCOL || 'http://'
const wwwDomain = process.env.WWWDOMAIN || 'localhost'
export const wwwPort = Number(process.env.WWWPORT) || 3000
export const wwwPath = `${wwwProtocol}${wwwDomain}:${wwwPort}`