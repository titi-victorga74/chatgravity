const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("Error opening DB:", err); return; }

    console.log("--- Data Entries (Cards) ---");
    db.all("SELECT id, content, area FROM data_entries", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));

        console.log("\n--- Card Items (Comments) ---");
        db.all("SELECT * FROM card_items", [], (err, items) => {
            if (err) console.error(err);
            else console.log(JSON.stringify(items, null, 2));
        });
    });
});
