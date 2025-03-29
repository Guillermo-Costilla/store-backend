import mysql from 'mysql2/promise';
import { config } from './config.js';

const pool = mysql.createPool({
    host: config.database.host, // 'sql10.freesqldatabase.com'
    user: config.database.user, // 'sql10770315'
    password: config.database.password, // 'Em4SAqG1pP'
    database: config.database.database, // 'sql10770315'
    port: config.database.port // 3306
});

export default pool