import mysql from 'mysql2/promise';
import { config } from './config.js';

const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user, 
    password: config.database.password,
    database: config.database.database, 
    port: config.database.port 
});

export default pool