const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("Error opening DB:", err); return; }

    console.log("Checking schema for taquera_items...");
    db.all("PRAGMA table_info(taquera_items)", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);

        console.log("\nChecking data in taquera_items...");
        db.all("SELECT * FROM taquera_items", [], (err, rows) => {
            if (err) console.error(err);
            else console.log(rows);
        });
    });
});
