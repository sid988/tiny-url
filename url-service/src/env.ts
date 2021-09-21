export const mongoDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017'
export const dbName = process.env.DBNAME || 'local'
const wwwProtocol = process.env.WWWPROTOCOL || 'http://'
const wwwDomain = process.env.WWWDOMAIN || 'localhost'
export const wwwPort = Number(process.env.WWWPORT) || 5000
export const wwwPath = `${wwwProtocol}${wwwDomain}:${wwwPort}`