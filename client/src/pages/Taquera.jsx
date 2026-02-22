import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Taquera({ cardId, cardName, onBack }) {
    const { user } = useAuth();
    const [taqueraOptions, setTaqueraOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState('');
    const [quantity, setQuantity] = useState('');
    const [savedItems, setSavedItems] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ show: false, itemId: null });

    useEffect(() => {
        setSavedItems([]); // Clear previous card's data immediately
        if (cardId) {
            fetchTaqueraOptions();
            fetchSavedItems();
        }
    }, [cardId]);

    const fetchTaqueraOptions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/taquera-options`);
            if (response.ok) {
                const result = await response.json();
                if (Array.isArray(result)) {
                    setTaqueraOptions(result);
                } else {
                    console.error("Expected array for options but got:", result);
                    setTaqueraOptions([]);
                }
            }
        } catch (error) {
            console.error("Error fetching options:", error);
            setTaqueraOptions([]);
        }
    };

    const fetchSavedItems = async () => {
        try {
            const response = await fetch(`${API_URL}/api/taquera-items?cardId=${cardId}`);
            if (response.ok) {
                const result = await response.json();
                if (Array.isArray(result)) {
                    setSavedItems(result);
                } else {
                    console.error("Expected array but got:", result);
                    setSavedItems([]);
                }
            }
        } catch (error) {
            console.error("Error fetching saved items:", error);
            setSavedItems([]);
        }
    };

    const handleSave = async () => {
        console.log(`[Taquera] Saving item "${selectedOption}" (Qty: ${quantity}) for CardID: ${cardId}`);
        if (selectedOption && quantity && cardId) {
            try {
                const response = await fetch(`${API_URL}/api/taquera-items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: selectedOption,
                        quantity: parseInt(quantity),
                        cardId: cardId
                    })
                });

                if (response.ok) {
                    setSelectedOption('');
                    setQuantity('');
                    fetchSavedItems(); // Refresh the list
                }
            } catch (error) {
                console.error("Error saving item:", error);
            }
        } else {
            alert("Falta seleccionar opción, cantidad o no hay tarjeta válida.");
        }
    };

    const handleStatusClick = (item) => {
        if (item.status === 'delivered') return;
        setConfirmModal({ show: true, itemId: item.id });
    };

    const confirmStatusUpdate = async () => {
        if (!confirmModal.itemId) return;

        try {
            const response = await fetch(`${API_URL}/api/taquera-items/${confirmModal.itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'delivered' })
            });

            if (response.ok) {
                fetchSavedItems();
                setConfirmModal({ show: false, itemId: null });
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="taquera-container">
            {(() => {
                try {
                    return (
                        <>
                            {/* DEBUG INFO - REMOVE LATER */}
                            <div style={{ background: '#333', color: '#0f0', padding: '5px', fontSize: '10px', marginBottom: '10px' }}>
                                DEBUG: CardID={cardId} Name="{cardName}" Items={savedItems.length}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1 className="taquera-title">Pedidos Taquera: {cardName}</h1>
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
                                {/* Left Side - Dropdown */}
                                <div className="taquera-panel">
                                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                                        Select Item
                                    </h2>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Choose an option:
                                        </label>
                                        <select
                                            className="pos-input"
                                            value={selectedOption}
                                            onChange={(e) => setSelectedOption(e.target.value)}
                                            style={{ width: '100%', padding: '1rem' }}
                                        >
                                            <option value="">-- Select --</option>
                                            {Array.isArray(taqueraOptions) && taqueraOptions.map(opt => (
                                                <option key={opt?.id || Math.random()} value={opt?.name || ''}>
                                                    {opt?.name || 'Unknown'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Quantity:
                                        </label>
                                        <input
                                            type="number"
                                            className="pos-input"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="Enter quantity"
                                            min="1"
                                            style={{ width: '100%', padding: '1rem' }}
                                        />
                                    </div>

                                    <button
                                        className="pos-action-btn"
                                        onClick={handleSave}
                                        disabled={!selectedOption || !quantity}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            opacity: (selectedOption && quantity) ? 1 : 0.5,
                                            cursor: (selectedOption && quantity) ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        SAVE
                                    </button>
                                </div>

                                {/* Right Side - Saved Items */}
                                <div className="taquera-saved-list">
                                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                                        Pedidos ({savedItems.length})
                                    </h2>

                                    {(!savedItems || savedItems.length === 0) ? (
                                        <div style={{
                                            textAlign: 'center',
                                            color: 'var(--text-secondary)',
                                            padding: '3rem',
                                            fontSize: '1.1rem'
                                        }}>
                                            No hay pedidos.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--accent-color)' }}>Cliente</th>
                                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-color)' }}>Cantidad</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--accent-color)' }}>Fecha</th>
                                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-color)' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {savedItems.map((item) => (
                                                        <tr
                                                            key={item?.id || Math.random()}
                                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                                        >
                                                            <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                                                {item?.name || 'Unknown'}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                                                {item?.quantity || 0}
                                                            </td>
                                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                                {(() => {
                                                                    try {
                                                                        return item?.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                                                    } catch (e) {
                                                                        return 'Invalid date';
                                                                    }
                                                                })()}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleStatusClick(item)}
                                                                    disabled={item?.status === 'delivered'}
                                                                    style={{
                                                                        background: item?.status === 'delivered' ? '#4caf50' : '#ffa502',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '0.5rem 1rem',
                                                                        borderRadius: '4px',
                                                                        cursor: item?.status === 'delivered' ? 'default' : 'pointer',
                                                                        fontWeight: '600',
                                                                        fontSize: '0.85rem',
                                                                        opacity: item?.status === 'delivered' ? 0.8 : 1,
                                                                        minWidth: '100px'
                                                                    }}
                                                                >
                                                                    {item?.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {confirmModal.show && (
                                <div className="overlay" onClick={() => setConfirmModal({ show: false, itemId: null })}>
                                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px', textAlign: 'center' }}>
                                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                            Confirmar Entrega
                                        </h3>
                                        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                                            Estas seguro de marcar este pedido como entregado?
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => setConfirmModal({ show: false, itemId: null })}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    background: '#555',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={confirmStatusUpdate}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    background: 'var(--accent-color)',
                                                    color: 'var(--bg-primary)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                } catch (e) {
                    console.error("Critical render error:", e);
                    return (
                        <div style={{ color: 'red', padding: '2rem' }}>
                            <h2>Error loading Taquera component</h2>
                            <pre style={{ background: '#333', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                                {e.toString()}
                            </pre>
                            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                                Reload Page
                            </button>
                        </div>
                    );
                }
            })()}
        </div>
    );
}
