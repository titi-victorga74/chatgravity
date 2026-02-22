const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Opening DB at:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("Error opening DB:", err); return; }

    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) console.error("Error listing tables:", err);
        else {
            console.log("Tables:", tables.map(t => t.name));

            if (tables.find(t => t.name === 'card_items')) {
                db.all("SELECT * FROM card_items", [], (err, rows) => {
                    if (err) console.error("Error fetching card_items:", err);
                    else console.log("Card Items Content:", JSON.stringify(rows, null, 2));
                });
            } else {
                console.log("card_items table does NOT exist.");
            }
        }
    });
});
