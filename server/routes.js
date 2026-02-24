const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authenticateToken, authorizeAdmin, SECRET_KEY } = require('./auth');

const router = express.Router();

// Register (Admin only for now, or initial setup)
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [username, hashedPassword, role || 'user'],
        function (err, result) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: result.insertId });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(`SELECT * FROM users WHERE username = ?`, [username], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.status(400).json({ error: "User not found" });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// Get Users (Admin only)
router.get('/users', authenticateToken, authorizeAdmin, (req, res) => {
    db.query(`SELECT id, username, role FROM users`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update User (Admin only)
router.put('/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;

    let query = 'UPDATE users SET username = ?, role = ?';
    let params = [username, role];

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.query(query, params, function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User updated successfully", changes: result.affectedRows });
    });
});

// Add Data Entry
router.post('/data', authenticateToken, (req, res) => {
    const { content, area } = req.body;
    db.query(`INSERT INTO data_entries (user_id, content, area) VALUES (?, ?, ?)`,
        [req.user.id, content, area],
        function (err, result) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId });
        }
    );
});

// Delete Data Entry (Admin only)
router.delete('/data/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM data_entries WHERE id = ?`, [id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully", changes: result.affectedRows });
    });
});

// Get Data Entries
router.get('/data', authenticateToken, (req, res) => {
    let query = `SELECT data_entries.*, users.username FROM data_entries JOIN users ON data_entries.user_id = users.id`;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Taquera Options
router.get('/taquera-options', (req, res) => {
    db.query(`SELECT * FROM taquera_options`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log("Serving taquera options:", rows);
        res.json(rows);
    });
});

// Get Taquera Items
router.get('/taquera-items', (req, res) => {
    const cardId = req.query.cardId;
    console.log(`[API] GET /taquera-items - Query cardId: "${cardId}"`);

    if (!cardId || cardId === 'undefined' || cardId === 'null') {
        console.log("[API] No valid cardId provided. Returning empty list.");
        return res.json([]);
    }

    const query = `SELECT * FROM taquera_items WHERE card_id = ? ORDER BY created_at DESC`;

    db.query(query, [cardId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add Taquera Item
router.post('/taquera-items', (req, res) => {
    const { name, quantity, cardId } = req.body;
    console.log(`[API] POST /taquera-items - Name: ${name}, Qty: ${quantity}, CardID: ${cardId}`);

    if (!cardId) {
        return res.status(400).json({ error: "cardId is required and cannot be null/undefined." });
    }

    db.query(`INSERT INTO taquera_items (name, quantity, card_id) VALUES (?, ?, ?)`,
        [name, quantity, cardId],
        function (err, result) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId });
        }
    );

});

// Get Taquera Counts (grouped by CardID and Status)
router.get('/taquera-counts', (req, res) => {
    const query = `
        SELECT card_id, status, SUM(quantity) as count 
        FROM taquera_items 
        WHERE card_id IS NOT NULL 
        GROUP BY card_id, status
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const counts = {};
        rows.forEach(row => {
            if (!counts[row.card_id]) {
                counts[row.card_id] = { pending: 0, delivered: 0 };
            }
            const statusKey = row.status ? row.status.toLowerCase() : 'pending';
            if (statusKey === 'pending') {
                counts[row.card_id].pending = row.count;
            } else if (statusKey === 'delivered' || statusKey === 'entregado' || statusKey === 'completed') {
                counts[row.card_id].delivered = row.count;
            }
        });

        res.json(counts);
    });
});

// Update Taquera Item Status
router.put('/taquera-items/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.query(`UPDATE taquera_items SET status = ? WHERE id = ?`, [status, id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Status updated successfully", changes: result.affectedRows });
    });
});

// Delete Taquera Item
router.delete('/taquera-items/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM taquera_items WHERE id = ?`, [id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully", changes: result.affectedRows });
    });
});

// GET Devoluciones Counts
router.get('/devoluciones-counts', (req, res) => {
    const query = `
        SELECT card_id, SUM(quantity) as count 
        FROM devoluciones_items 
        WHERE card_id IS NOT NULL 
        GROUP BY card_id
    `;
    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const counts = {};
        rows.forEach(row => {
            counts[row.card_id] = row.count;
        });
        res.json(counts);
    });
});

// GET Devoluciones Items
router.get('/devoluciones-items', (req, res) => {
    const cardId = req.query.cardId;
    if (!cardId) return res.status(400).json({ error: "cardId is required" });

    const query = `SELECT * FROM devoluciones_items WHERE card_id = ? ORDER BY created_at DESC`;
    db.query(query, [cardId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST Devoluciones Item
router.post('/devoluciones-items', (req, res) => {
    const { cardId, name, quantity } = req.body;
    if (!cardId || !name) return res.status(400).json({ error: "cardId and name are required" });

    const query = `INSERT INTO devoluciones_items (card_id, name, quantity) VALUES (?, ?, ?)`;
    db.query(query, [cardId, name, quantity || 1], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId });
    });
});

// GET Ruta Counts
router.get('/ruta-counts', (req, res) => {
    const query = `
        SELECT card_id, SUM(quantity) as count 
        FROM ruta_items 
        WHERE card_id IS NOT NULL 
        GROUP BY card_id
    `;
    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const counts = {};
        rows.forEach(row => {
            counts[row.card_id] = row.count;
        });
        res.json(counts);
    });
});

// GET Ruta Items
router.get('/ruta-items', (req, res) => {
    const cardId = req.query.cardId;
    if (!cardId) return res.status(400).json({ error: "cardId is required" });

    const query = `SELECT * FROM ruta_items WHERE card_id = ? ORDER BY created_at DESC`;
    db.query(query, [cardId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST Ruta Item
router.post('/ruta-items', (req, res) => {
    const { cardId, name, quantity } = req.body;
    if (!cardId || !name) return res.status(400).json({ error: "cardId and name are required" });

    const query = `INSERT INTO ruta_items (card_id, name, quantity) VALUES (?, ?, ?)`;
    db.query(query, [cardId, name, quantity || 1], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId });
    });
});

// Card Items Routes (For sub-items in a card)
router.get('/card-items/:cardId', (req, res) => {
    const cardId = req.params.cardId;
    console.log(`[API] GET /card-items/${cardId} - Request received`);

    db.query(`SELECT card_items.*, users.username FROM card_items 
            LEFT JOIN users ON card_items.user_id = users.id 
            WHERE card_id = ? ORDER BY created_at ASC`, [cardId], (err, rows) => {
        if (err) {
            console.error(`[API] Error fetching items for card ${cardId}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[API] Found ${rows.length} items for cardId ${cardId}`);
        res.json(rows);
    });
});

router.post('/card-items', authenticateToken, (req, res) => {
    const { cardId, text } = req.body;
    console.log(`[API] POST /card-items - Adding item: "${text}" to cardId: ${cardId} by User: ${req.user.id}`);

    db.query(`INSERT INTO card_items (card_id, text, user_id) VALUES (?, ?, ?)`,
        [cardId, text, req.user.id],
        function (err, result) {
            if (err) {
                console.error(`[API] Error inserting item:`, err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`[API] Item inserted successfully. New ID: ${result.insertId}`);
            res.json({ id: result.insertId, username: req.user.username });
        }
    );
});

router.delete('/card-items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM card_items WHERE id = ?`, [id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

module.exports = router;
