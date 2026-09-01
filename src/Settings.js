import { useState, useEffect } from 'react';
import './Settings.css';
import Sidebar from './Sidebar';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('Users');

    const [storeName, setStoreName] = useState('My Store');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('PKR');

    const [users, setUsers] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [signupError, setSignupError] = useState('');

    const [waStatus, setWaStatus] = useState('disconnected');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const [selectedTable, setSelectedTable] = useState('customers');

    const [bankAccounts, setBankAccounts] = useState([]);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [newBankName, setNewBankName] = useState('');
    const [newAccountTitle, setNewAccountTitle] = useState('');
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newQrCode, setNewQrCode] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) { }
    };

    const fetchBankAccounts = async () => {
        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/bank-accounts');
            if (response.ok) {
                const data = await response.json();
                setBankAccounts(data);
            }
        } catch (error) { }
    };

    useEffect(() => {
        if (activeTab === 'Users') {
            fetchUsers();
        } else if (activeTab === 'Bank Details') {
            fetchBankAccounts();
        }
    }, [activeTab]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/api/settings/brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeName, address, phone, currency }),
            });
            if (response.ok) {
                alert('Brand settings saved successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch (err) {
            alert('Connection to server failed.');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUsername || !newPassword) return;

        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUsername, password: newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('User added to database successfully.');
                setNewUsername('');
                setNewPassword('');
                setSignupError('');
                fetchUsers();
            } else {
                setSignupError(data.message || 'Registration failed');
            }
        } catch (err) {
            setSignupError('Connection to server failed.');
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://alifabrics-pos-backend-production.up.railway.app/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete user.');
            }
        } catch (error) {
            alert('Connection to server failed while deleting.');
        }
    };

    const handleFetchQR = async () => {
        setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MockWhatsAppQRData');
        setWaStatus('pending');
        setTimeout(() => {
            setWaStatus('connected');
            setQrCodeUrl('');
        }, 5000);
    };

    const handleDownloadBackup = () => {
        window.open(`http://alifabrics-pos-backend-production.up.railway.app/api/backup?table=${selectedTable}`, '_blank');
    };

    const handleQrUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewQrCode(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddBank = async (e) => {
        e.preventDefault();
        if (!newBankName || !newAccountTitle || !newAccountNumber) return;

        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/bank-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_name: newBankName,
                    account_title: newAccountTitle,
                    account_number: newAccountNumber,
                    qr_code: newQrCode
                })
            });

            if (response.ok) {
                alert('Bank account added successfully!');
                setShowAddBankModal(false);
                setNewBankName('');
                setNewAccountTitle('');
                setNewAccountNumber('');
                setNewQrCode('');
                fetchBankAccounts();
            } else {
                alert('Failed to add bank account.');
            }
        } catch (err) {
            alert('Connection to server failed.');
        }
    };

    const handleToggleBankStatus = async (id, currentStatus) => {
        try {
            const response = await fetch(`http://alifabrics-pos-backend-production.up.railway.app/bank-accounts/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (response.ok) {
                fetchBankAccounts();
            }
        } catch (err) {
            alert('Connection to server failed.');
        }
    };

    return (
        <div className='settings-layout'>
            <Sidebar />

            <div className='settings-side'>
                <div className='settings-header'>
                    <h1>Settings</h1>
                    <button className='btn-save' onClick={handleSave}>Save Changes</button>
                </div>

                <div className="settings-tabs">
                    {['General', 'Users', 'Bank Details', 'WhatsApp', 'Backup'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    <form className="settings-form">
                        {activeTab === 'General' && (
                            <div className="settings-section animate-fade">
                                <h2>Store Profile (Brand Info)</h2>
                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label>Store Name</label>
                                        <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label>Physical Address</label>
                                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Default Currency</label>
                                        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                            <option value="PKR">PKR - Pakistani Rupee</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Users' && (
                            <div className="settings-section animate-fade">
                                <h2>System Users</h2>

                                <div className="table-wrapper" style={{ marginBottom: '30px' }}>
                                    <table className="settings-table">
                                        <thead>
                                            <tr>
                                                <th>User ID</th>
                                                <th>Username</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id} className="user-row">
                                                    <td>#{user.id}</td>
                                                    <td>
                                                        <span className="username-text">
                                                            {user.username}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-remove"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <h2>Add New User</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter username" />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter secure password" />
                                    </div>
                                </div>
                                {signupError && <p style={{ color: 'red' }}>{signupError}</p>}
                                <div className="form-row">
                                    <button type="button" className="btn-save" onClick={handleAddUser}>Create User</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Bank Details' && (
                            <div className="settings-section animate-fade">
                                <div className="section-header-row">
                                    <h2>Bank Accounts</h2>
                                    <button type="button" className="btn-save" onClick={() => setShowAddBankModal(true)}>+ Add Account</button>
                                </div>

                                <div className="table-wrapper">
                                    <table className="settings-table">
                                        <thead>
                                            <tr>
                                                <th>QR Code</th>
                                                <th>Bank Name</th>
                                                <th>Account Title</th>
                                                <th>Account Number</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bankAccounts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748B' }}>No bank accounts added yet.</td>
                                                </tr>
                                            ) : (
                                                bankAccounts.map(account => (
                                                    <tr key={account.id}>
                                                        <td>
                                                            {account.qr_code ? (
                                                                <img
                                                                    src={account.qr_code}
                                                                    alt="QR"
                                                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                                                />
                                                            ) : (
                                                                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>None</span>
                                                            )}
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{account.bank_name}</td>
                                                        <td>{account.account_title}</td>
                                                        <td style={{ fontFamily: 'monospace' }}>{account.account_number}</td>
                                                        <td>
                                                            <span className={`status-pill ${account.is_active ? 'active-pill' : 'inactive-pill'}`}>
                                                                {account.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className={account.is_active ? "btn-secondary-small" : "btn-view-details"}
                                                                onClick={() => handleToggleBankStatus(account.id, account.is_active)}
                                                            >
                                                                {account.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'WhatsApp' && (
                            <div className="settings-section animate-fade">
                                <h2>WhatsApp Configuration</h2>
                                <div className="whatsapp-status-card">
                                    <div className="status-header">
                                        <h3>Connection Status:</h3>
                                        <span className={`status-badge ${waStatus}`}>{waStatus.toUpperCase()}</span>
                                    </div>
                                    {waStatus === 'disconnected' && (
                                        <div className="qr-container empty">
                                            <p>Link your WhatsApp account to send digital receipts and alerts.</p>
                                            <button type="button" className="btn-save" onClick={handleFetchQR}>Generate QR Code</button>
                                        </div>
                                    )}
                                    {waStatus === 'pending' && (
                                        <div className="qr-container">
                                            <p>Scan this code with your WhatsApp mobile app to link.</p>
                                            {qrCodeUrl && <img src={qrCodeUrl} alt="WhatsApp QR Code" className="qr-image" />}
                                        </div>
                                    )}
                                    {waStatus === 'connected' && (
                                        <div className="qr-container connected">
                                            <p>Your WhatsApp is successfully linked to the POS system.</p>
                                            <button type="button" className="btn-cancel" onClick={() => setWaStatus('disconnected')}>Disconnect</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Backup' && (
                            <div className="settings-section animate-fade">
                                <h2>Database Export</h2>
                                <p className="backup-description">
                                    Select the specific database table you want to export. It will be downloaded as an Excel (.xlsx) file.
                                </p>

                                <div className="backup-action-card">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Select File/Table to Download</label>
                                        <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
                                            <option value="customers">Customers</option>
                                            <option value="inventory">Inventory</option>
                                            <option value="items">Items</option>
                                            <option value="payments">Payments</option>
                                            <option value="purchases">Purchases</option>
                                            <option value="vendors">Vendors</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-save backup-btn"
                                        onClick={handleDownloadBackup}
                                        style={{ alignSelf: 'flex-end', marginBottom: '4px' }}
                                    >
                                        Download {selectedTable}.xlsx
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {showAddBankModal && (
                <div className="modal-backdrop" onClick={() => setShowAddBankModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <h3>Add Bank Account</h3>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowAddBankModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Bank Name</label>
                                <input type="text" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} placeholder="e.g. Meezan Bank" required />
                            </div>
                            <div className="form-group">
                                <label>Account Title</label>
                                <input type="text" value={newAccountTitle} onChange={(e) => setNewAccountTitle(e.target.value)} placeholder="e.g. Ali Fabrics" required />
                            </div>
                            <div className="form-group">
                                <label>Account Number / IBAN</label>
                                <input type="text" value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value)} placeholder="PK00 MEEZ..." required />
                            </div>
                            <div className="form-group">
                                <label>QR Code Image (Optional)</label>
                                <input type="file" accept="image/*" onChange={handleQrUpload} />
                                {newQrCode && <img src={newQrCode} alt="QR Preview" className="qr-preview-small" />}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowAddBankModal(false)}>Cancel</button>
                            <button type="button" className="btn-save" style={{ marginLeft: '12px' }} onClick={handleAddBank}>Save Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}