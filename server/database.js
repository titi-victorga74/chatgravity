const mysql = require('mysql2');

// Create a connection pool (better for production than single connection)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database.');
    connection.release();

    // Create tables
    initDatabase();
});

function initDatabase() {
    pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
    )`, (err) => {
        if (err) console.error("Error creating users table:", err.message);
    });

    pool.query(`CREATE TABLE IF NOT EXISTS data_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        content TEXT,
        area VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) console.error("Error creating data_entries table:", err.message);
    });

    pool.query(`CREATE TABLE IF NOT EXISTS taquera_options (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) UNIQUE
    )`, (err) => {
        if (err) {
            console.error("Error creating taquera_options table:", err.message);
        } else {
            // Seed initial options if table is empty
            pool.query("SELECT count(*) as count FROM taquera_options", (err, rows) => {
                if (rows && rows[0].count === 0) {
                    const initialOptions = ['Tacos al Pastor', 'Tacos de Asada', 'Gringas', 'Refrescos'];
                    initialOptions.forEach(opt => {
                        pool.query("INSERT IGNORE INTO taquera_options (name) VALUES (?)", [opt]);
                    });
                    console.log("Seeded taquera_options");
                }
            });
        }
    });

    pool.query(`CREATE TABLE IF NOT EXISTS taquera_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        card_id INT,
        quantity INT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("Error creating taquera_items table:", err.message);
    });

    pool.query(`CREATE TABLE IF NOT EXISTS card_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        card_id INT,
        text TEXT,
        user_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(card_id) REFERENCES data_entries(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating card_items table:", err.message);
        } else {
            console.log("Card items table ready");
        }
    });

    pool.query(`CREATE TABLE IF NOT EXISTS devoluciones_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        card_id INT,
        name VARCHAR(255),
        quantity INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(card_id) REFERENCES data_entries(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating devoluciones_items table:", err.message);
        } else {
            console.log("Devoluciones items table ready");
        }
    });

    pool.query(`CREATE TABLE IF NOT EXISTS ruta_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        card_id INT,
        name VARCHAR(255),
        quantity INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(card_id) REFERENCES data_entries(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating ruta_items table:", err.message);
        } else {
            console.log("Ruta items table ready");
        }
    });
}

module.exports = pool;
