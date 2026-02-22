const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT * FROM taquera_options", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Data in taquera_options:", rows);
    }
    db.close();
});
