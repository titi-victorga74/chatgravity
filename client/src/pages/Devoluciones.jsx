import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function Devoluciones({ cardId, cardName, onBack }) {
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState('');
    const [quantity, setQuantity] = useState('');
    const [savedItems, setSavedItems] = useState([]);

    useEffect(() => {
        fetchOptions();
        if (cardId) fetchSavedItems();
    }, [cardId]);

    const fetchOptions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/taquera-options`);
            if (res.ok) setOptions(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSavedItems = async () => {
        try {
            const res = await fetch(`${API_URL}/api/devoluciones-items?cardId=${cardId}`);
            if (res.ok) setSavedItems(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!selectedOption || !cardId || quantity < 1) return;
        try {
            const res = await fetch(`${API_URL}/api/devoluciones-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId,
                    name: selectedOption,
                    quantity: parseInt(quantity)
                })
            });
            if (res.ok) {
                fetchSavedItems();
                setSelectedOption('');
                setQuantity(1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="taquera-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="taquera-title" style={{ color: '#ff4757' }}>Devoluciones: {cardName}</h1>
                <button
                    onClick={onBack}
                    style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    &larr; Volver
                </button>
            </div>

            <div className="taquera-grid">
                {/* Left Panel */}
                <div className="taquera-panel">
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Registrar Devolución</h2>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Seleccionar Item:</label>
                        <select
                            className="pos-input"
                            value={selectedOption}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            <option value="">-- Seleccionar --</option>
                            {options.map(opt => (
                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cantidad:</label>
                        <input
                            type="number"
                            className="pos-input"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            style={{ width: '100%', padding: '1rem' }}
                        />
                    </div>

                    <button
                        className="pos-action-btn"
                        onClick={handleSave}
                        disabled={!selectedOption || quantity < 1}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            marginTop: '1rem',
                            background: '#ff4757', // Red for returns
                            opacity: (selectedOption && quantity >= 1) ? 1 : 0.5,
                            cursor: (selectedOption && quantity >= 1) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        GUARDAR DEVOLUCIÓN
                    </button>
                </div>

                {/* Right Panel */}
                <div className="taquera-saved-list">
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Devoluciones Registradas</h2>
                    {savedItems.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay devoluciones registradas.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#ff4757' }}>Item</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#ff4757', width: '80px' }}>Cant.</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#ff4757' }}>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {savedItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
