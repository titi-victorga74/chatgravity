const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Opening DB at:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("Error opening DB:", err); return; }

    db.run(`CREATE TABLE IF NOT EXISTS card_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER,
        text TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(card_id) REFERENCES data_entries(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) console.error("Error creating table:", err);
        else console.log("Success: card_items table created/verified.");
    });
});
