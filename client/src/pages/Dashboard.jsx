import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Users from './Users';
import Taquera from './Taquera';
import Devoluciones from './Devoluciones';
import Ruta from './Ruta';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [data, setData] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [area, setArea] = useState('');

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [taqueraCounts, setTaqueraCounts] = useState({});
    const [devolucionesCounts, setDevolucionesCounts] = useState({});
    const [rutaCounts, setRutaCounts] = useState({});

    useEffect(() => {
        fetchData();
        // Auto-close sidebar on small screens initially
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    // Handle browser back button
    useEffect(() => {
        if (activeView !== 'dashboard') {
            // Push state only if we haven't already for this view
            const state = window.history.state;
            if (!state || state.view !== activeView) {
                window.history.pushState({ view: activeView }, '');
            }

            const handlePopState = () => {
                setActiveView('dashboard');
                setSelectedItem(null);
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [activeView]);

    const fetchRutaCounts = async () => {
        try {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3001/api/ruta-counts`);
            if (response.ok) {
                const result = await response.json();
                setRutaCounts(result);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDevolucionesCounts = async () => {
        try {
            const hostname = window.location.hostname;
            console.log(`[Dashboard] Fetching devoluciones counts from http://${hostname}:3001/api/devoluciones-counts`);
            const response = await fetch(`http://${hostname}:3001/api/devoluciones-counts`);
            if (response.ok) {
                const result = await response.json();
                console.log("[Dashboard] Devoluciones counts received:", result);
                setDevolucionesCounts(result);
            } else {
                console.error("[Dashboard] Failed to fetch devoluciones counts:", response.status);
            }
        } catch (error) {
            console.error("[Dashboard] Error fetching devoluciones counts:", error);
        }
    };

    const fetchTaqueraCounts = async () => {
        try {
            const hostname = window.location.hostname;
            console.log(`[Dashboard] Fetching taquera counts from http://${hostname}:3001/api/taquera-counts`);
            const response = await fetch(`http://${hostname}:3001/api/taquera-counts`);
            if (response.ok) {
                const result = await response.json();
                console.log("[Dashboard] Taquera counts received:", result);
                setTaqueraCounts(result);
            } else {
                console.error("[Dashboard] Failed to fetch counts:", response.status);
            }
        } catch (error) {
            console.error("[Dashboard] Error fetching taquera counts:", error);
        }
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3001/api/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const result = await response.json();
            setData(result);
            fetchTaqueraCounts(); // Fetch counts whenever data is refreshed
            fetchDevolucionesCounts();
            fetchRutaCounts();
        }
    };

    // Effect to refresh counts when returning to dashboard view
    useEffect(() => {
        if (activeView === 'dashboard') {
            fetchTaqueraCounts();
            fetchDevolucionesCounts();
            fetchRutaCounts();
        }
    }, [activeView]);

    const handleAddData = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;
        await fetch(`http://${hostname}:3001/api/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent, area })
        });
        setNewContent('');
        setArea('');
        fetchData();
    };

    const [selectedItem, setSelectedItem] = useState(null);
    const [taqueraOptions, setTaqueraOptions] = useState([]);
    const [cardItems, setCardItems] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [newCardItem, setNewCardItem] = useState('');

    const handleDeleteData = async (id, e) => {
        e.stopPropagation(); // Prevent card click if any
        if (!confirm('Are you sure you want to delete this item?')) return;

        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3001/api/data/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchData();
        } else {
            alert('Failed to delete item');
        }
    };

    const fetchTaqueraOptions = async () => {
        try {
            console.log("Fetching Taquera Options (No Auth)...");
            // Use window.location.hostname to dynamically pick the correct IP/localhost that the browser is using
            const hostname = window.location.hostname;
            const url = `http://${hostname}:3001/api/taquera-options`;

            console.log(`Fetching from: ${url}`);
            const response = await fetch(url); // No headers needed for public route

            if (response.ok) {
                const result = await response.json();
                console.log("Taquera Options FETCH SUCCESS:", result);
                if (Array.isArray(result)) {
                    setTaqueraOptions(result);
                } else {
                    console.error("Result is not an array:", result);
                }
            } else {
                console.error("Failed to fetch options:", response.status);
            }
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    // Effect to fetch card items whenever selectedItem changes
    useEffect(() => {
        let active = true;

        if (selectedItem && selectedItem.area.trim().toUpperCase() !== 'TAQUERA') {
            setCardItems([]); // Clear previous items immediately
            setIsLoadingItems(true); // Start loading

            const loadItems = async () => {
                try {
                    const hostname = window.location.hostname;
                    console.log(`[Dashboard] Fetching items for card ID: ${selectedItem.id}`);
                    const response = await fetch(`http://${hostname}:3001/api/card-items/${selectedItem.id}`);

                    if (response.ok) {
                        const result = await response.json();
                        if (active) {
                            console.log(`[Dashboard] Items loaded for card ${selectedItem.id}:`, result);
                            setCardItems(result);
                        }
                    } else {
                        console.error(`[Dashboard] Failed to fetch items: ${response.status}`);
                    }
                } catch (error) {
                    console.error("[Dashboard] Error fetching card items:", error);
                } finally {
                    if (active) {
                        setIsLoadingItems(false); // Stop loading
                    }
                }
            };

            loadItems();
        } else {
            setCardItems([]);
        }

        return () => {
            active = false; // Cleanup flag to prevent setting state on unmounted/changed component
        };
    }, [selectedItem]);

    // Manual fetch function (hoisted/defined outside useEffect to be usable by handleAddCardItem)
    const fetchCardItems = async (cardId) => {
        try {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3001/api/card-items/${cardId}`);
            if (response.ok) {
                const result = await response.json();
                setCardItems(result);
            }
        } catch (error) {
            console.error("Error fetching card items:", error);
        }
    };

    const handleAddCardItem = async () => {
        if (!newCardItem.trim() || !selectedItem) return;

        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;
        console.log(`[Dashboard] Adding item "${newCardItem}" for Card ID: ${selectedItem.id}`);

        try {
            const response = await fetch(`http://${hostname}:3001/api/card-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cardId: selectedItem.id, text: newCardItem })
            });

            if (response.ok) {
                console.log("[Dashboard] Add success. Refreshing items...");
                setNewCardItem('');
                // Re-fetch items for THIS card
                fetchCardItems(selectedItem.id);
            } else {
                console.error("[Dashboard] Failed to add item:", response.status);
                alert("Error al agregar dato.");
            }
        } catch (error) {
            console.error("[Dashboard] Network error adding item:", error);
        }
    };

    const openModal = (item) => {
        setSelectedItem(item);
        if (item.area.trim().toUpperCase() === 'TAQUERA') {
            setActiveView('taquera');
        } else if (item.area.trim().toUpperCase() === 'DEVOLUCIONES') {
            setActiveView('devoluciones');
        } else if (item.area.trim().toUpperCase() === 'RUTA') {
            setActiveView('ruta');
        } else {
            // Fetching for non-Taquera/Devoluciones is handled by useEffect on selectedItem
        }
    };

    const closeModal = () => {
        setSelectedItem(null);
        setTaqueraOptions([]);
        setCardItems([]);
        setNewCardItem('');
    };

    return (
        <div className={`dashboard ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
            <header className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="hamburger-btn"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="Toggle Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <div className="brand">POS SYSTEM</div>
                </div>
                <div className="user-info">
                    <span>{user?.username} ({user?.role})</span>
                    <button className="logout-btn" onClick={logout}>LOGOUT</button>
                </div>
            </header>

            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div
                    className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >
                    Dashboard
                </div>
                {user?.role === 'admin' && (
                    <div
                        className={`nav-item ${activeView === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveView('users')}
                    >
                        Users
                    </div>
                )}
                <div className="nav-item">Settings</div>
            </aside>

            <main className="main-content">
                {activeView === 'dashboard' ? (
                    <>
                        {user?.role === 'admin' && (
                            <div className="pos-input-panel">
                                <div className="input-group">
                                    <label>AREA</label>
                                    <input
                                        className="pos-input"
                                        placeholder="Sales / IT / HR"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>DATA ENTRY</label>
                                    <input
                                        className="pos-input"
                                        placeholder="Enter new information here..."
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                    />
                                </div>
                                <button className="pos-action-btn" onClick={handleAddData}>ADD +</button>
                            </div>
                        )}

                        <div className="pos-grid">
                            {data.map((item) => (
                                <div key={item.id} className="pos-card" onClick={() => openModal(item)}>
                                    <div className="card-header">
                                        <span className="card-area">{item.area}</span>
                                        {user?.role === 'admin' && (
                                            <button
                                                className="delete-btn"
                                                onClick={(e) => handleDeleteData(item.id, e)}
                                                title="Delete Item"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <div className="card-content">
                                        {item.content}
                                    </div>

                                    {/* Display Taquera Counts */}
                                    {taqueraCounts[item.id] && (taqueraCounts[item.id].pending > 0 || taqueraCounts[item.id].delivered > 0) && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {taqueraCounts[item.id].pending > 0 && (
                                                <span style={{
                                                    background: '#ffc107',
                                                    color: '#000',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Pendientes: {taqueraCounts[item.id].pending}
                                                </span>
                                            )}
                                            {taqueraCounts[item.id].delivered > 0 && (
                                                <span style={{
                                                    background: '#4caf50',
                                                    color: '#fff',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Entregados: {taqueraCounts[item.id].delivered}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Display Devoluciones Count */}
                                    {devolucionesCounts[item.id] > 0 && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span style={{
                                                background: '#ff4757',
                                                color: '#fff',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                Devoluciones: {devolucionesCounts[item.id]}
                                            </span>
                                        </div>
                                    )}

                                    {/* Display Ruta Count */}
                                    {rutaCounts[item.id] > 0 && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span style={{
                                                background: '#00d2ff',
                                                color: '#000',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                Ruta: {rutaCounts[item.id]}
                                            </span>
                                        </div>
                                    )}
                                    <div className="card-footer">
                                        <span>User: {item.username}</span>
                                        <span>ID: #{item.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedItem && (
                            <div className="overlay" onClick={closeModal}>
                                <div className="modal" onClick={(e) => e.stopPropagation()} key={selectedItem.id}>
                                    {/* Empty modal content for now */}
                                    <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>{selectedItem.area}</h2>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>{selectedItem.content}</p>

                                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                            Datos Agregados: {selectedItem.content}
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                            {isLoadingItems ? (
                                                <div style={{ padding: '1rem', textAlign: 'center', color: '#ffeb3b', fontStyle: 'italic' }}>
                                                    Cargando datos...
                                                </div>
                                            ) : cardItems.length === 0 ? (
                                                <div style={{ color: '#666', fontStyle: 'italic' }}>No hay datos adicionales.</div>
                                            ) : (
                                                cardItems.map((item) => (
                                                    <div key={item.id} style={{
                                                        background: 'var(--bg-tertiary)',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.9rem',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span>{item.text}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {item.username}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="pos-input"
                                                placeholder="Agregar dato..."
                                                value={newCardItem}
                                                onChange={(e) => setNewCardItem(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddCardItem()}
                                            />
                                            <button
                                                className="pos-action-btn"
                                                style={{ width: 'auto', marginTop: 0 }}
                                                onClick={handleAddCardItem}
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                        <button onClick={closeModal} style={{
                                            background: '#555',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.5rem 1.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}>
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeView === 'users' ? (
                    <Users />
                ) : activeView === 'taquera' ? (
                    <Taquera
                        key={selectedItem?.id}
                        cardId={selectedItem?.id}
                        cardName={selectedItem?.content}
                        onBack={() => window.history.back()}
                    />
                ) : activeView === 'devoluciones' ? (
                    <Devoluciones
                        key={selectedItem?.id}
                        cardId={selectedItem?.id}
                        cardName={selectedItem?.content}
                        onBack={() => window.history.back()}
                    />
                ) : activeView === 'ruta' ? (
                    <Ruta
                        key={selectedItem?.id}
                        cardId={selectedItem?.id}
                        cardName={selectedItem?.content}
                        onBack={() => window.history.back()}
                    />
                ) : null}
            </main>
        </div >
    );
}
