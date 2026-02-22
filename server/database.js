const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )`, (err) => {
            if (err) {
                console.error("Error creating users table: " + err.message);
            } else {
                // Insert default admin user if not exists (password: admin123)
                // In a real app, passwords should be hashed. Here we will use bcrypt later.
                // For simplicity now, let's just create the table. The initial admin will be created via seed or manually.
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS data_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT,
            area TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating data_entries table: " + err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS taquera_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )`, (err) => {
            if (err) {
                console.error("Error creating taquera_options table: " + err.message);
            } else {
                // Seed some initial options
                db.all("SELECT count(*) as count FROM taquera_options", [], (err, rows) => {
                    if (rows && rows[0].count === 0) {
                        const initialOptions = ['Tacos al Pastor', 'Tacos de Asada', 'Gringas', 'Refrescos'];
                        const stmt = db.prepare("INSERT INTO taquera_options (name) VALUES (?)");
                        initialOptions.forEach(opt => stmt.run(opt));
                        stmt.finalize();
                        console.log("Seeded taquera_options");
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS taquera_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            card_id INTEGER,
            quantity INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating taquera_items table: " + err.message);
            } else {
                // Migration: Ensure status column exists (for existing tables)
                db.run(`ALTER TABLE taquera_items ADD COLUMN status TEXT DEFAULT 'pending'`, (err) => { });

                // Migration: Ensure card_id column exists
                db.run(`ALTER TABLE taquera_items ADD COLUMN card_id INTEGER`, (err) => {
                    // Ignore duplicate column error
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS card_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            text TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(card_id) REFERENCES data_entries(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating card_items table: " + err.message);
            } else {
                console.log("Card items table ready");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS devoluciones_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            name TEXT,
            quantity INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(card_id) REFERENCES data_entries(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating devoluciones_items table: " + err.message);
            } else {
                console.log("Devoluciones items table ready");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS ruta_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            name TEXT,
            quantity INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(card_id) REFERENCES data_entries(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating ruta_items table: " + err.message);
            } else {
                console.log("Ruta items table ready");
            }
        });
    }
});

module.exports = db;
