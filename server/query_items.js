const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("Error opening DB:", err); return; }

    db.all("SELECT * FROM card_items", [], (err, rows) => {
        if (err) console.error("Error fetching card_items:", err);
        else console.log("Card Items Content:\n", JSON.stringify(rows, null, 2));
    });
});
