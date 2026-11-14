import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { fetchWithAuth } from './api';

export default function Vendors() {
    const [addClick, toggleAddClick] = useState(false);
    const addBtnClick = () => toggleAddClick(!addClick);
    const onClose = () => toggleAddClick(false);
    const handleModalClick = (e) => e.stopPropagation();

    const [vendorName, setVendorName] = useState('');
    const [contact, setContact] = useState('');
    const [balance, setBalance] = useState('');
    const [vendorData, setVendorData] = useState([]);
    const [viewVendor, setViewVendor] = useState(null);
    const [vendorBrands, setVendorBrands] = useState([]);
    const [vendorPurchases, setVendorPurchases] = useState([]);
    const [showLedger, setShowLedger] = useState(false);
    const [vendorLedger, setVendorLedger] = useState([]);
    const [savingVendor, setSavingVendor] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const addVendor = async (e) => {
        e.preventDefault();
        const finalVendorName = vendorName.trim();
        const finalContact = contact.trim();
        const finalBalance = balance.trim();
        if (!finalVendorName || !finalContact || !finalBalance) return;

        setSavingVendor(true);
        try {
            const response = await fetchWithAuth('https://alifabrics-pos-backend-production.up.railway.app/add-vendors', {
                method: 'POST',
                body: JSON.stringify({ vendorName: finalVendorName, contact: finalContact, balance: finalBalance })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Unable to add vendor');
                return;
            }

            await fetchVendors();
            setVendorName('');
            setContact('');
            setBalance('');
            toggleAddClick(false);
            alert('Vendor added successfully!');
        } catch (error) {
            if (error.message !== 'Session expired') alert('Could not save vendor. Please try again.');
        } finally {
            setSavingVendor(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await fetchWithAuth('https://alifabrics-pos-backend-production.up.railway.app/get-vendors');
            if (!response.ok) throw new Error(`Error retrieving vendors: ${response.status}`);
            const result = await response.json();
            setVendorData(result);
        } catch (error) {
            if (error.message !== "Session expired") console.log('Error occured: ', error);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleVendorClick = async (vendor) => {
        setViewVendor(vendor);
        setVendorBrands([]);
        setVendorPurchases([]);
        setShowLedger(false);
        setVendorLedger([]);

        try {
            const response = await fetchWithAuth(`https://alifabrics-pos-backend-production.up.railway.app/vendors/${vendor.id}/details`);
            if (!response.ok) throw new Error('Failed to fetch vendor details');
            const data = await response.json();
            setVendorBrands(data.brands || []);
            setVendorPurchases(data.purchases || []);
            setViewVendor(current => current?.id === vendor.id ? { ...current, current_balance: data.currentBalance } : current);
        } catch (error) {
            if (error.message !== 'Session expired') alert('Could not load vendor details.');
        }
    };

    const handleDeleteVendor = async (e, vendorId, vendorName) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) return;

        try {
            const response = await fetchWithAuth(`https://alifabrics-pos-backend-production.up.railway.app/vendors/${vendorId}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok) {
                alert('Vendor deleted successfully.');
                fetchVendors();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            if (error.message !== "Session expired") alert('Failed to connect to the server.');
        }
    };

    const fetchLedger = async (vendorId) => {
        try {
            const response = await fetchWithAuth(`https://alifabrics-pos-backend-production.up.railway.app/vendors/${vendorId}/ledger`);
            if (!response.ok) throw new Error('Failed to load vendor ledger');
            const result = await response.json();
            if (!result.success) throw new Error('Failed to load vendor ledger');

            let runningBalance = Number(result.openingBalance) || 0;
            const processedLedger = [];
            if (runningBalance !== 0) {
                processedLedger.push({
                    transaction_date: result.createdAt,
                    type: 'Opening Balance',
                    description: 'Balance brought forward',
                    credit_owed: runningBalance > 0 ? runningBalance : 0,
                    debit_paid: runningBalance < 0 ? Math.abs(runningBalance) : 0,
                    balance: runningBalance
                });
            }

            for (const txn of result.data || []) {
                runningBalance += Number(txn.credit_owed) - Number(txn.debit_paid);
                processedLedger.push({ ...txn, balance: runningBalance });
            }
            setVendorLedger(processedLedger);
        } catch (error) {
            if (error.message !== 'Session expired') alert('Could not load the vendor ledger.');
        }
    };

    const handleToggleLedger = () => {
        if (!showLedger && vendorLedger.length === 0) fetchLedger(viewVendor.id);
        setShowLedger(!showLedger);
    };

    const closeViewModal = () => {
        setViewVendor(null);
    };

    return (
        <div className='inventory-layout'>
            <Sidebar />
            <div className='inventory-side'>
                <div className='inventory-header'>
                    <h1>Vendors</h1>
                    <button className='add-product-btn' onClick={addBtnClick}>+ Add Vendor</button>
                </div>
                <div className='table-wrapper'>
                    <table className='inventory-table'>
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Contact</th>
                                <th>Balance</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendorData.map((item) => (
                                <tr key={item.id} className="inventory-table-row" onClick={() => handleVendorClick(item)}>
                                    <td style={{ textTransform: 'capitalize' }}><strong>{item.company_name || item.contact_person}</strong></td>
                                    <td><strong>{item.phone}</strong></td>
                                    <td><strong>PKR {Number(item.current_balance).toLocaleString()}</strong></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="remove-btn" onClick={(e) => handleDeleteVendor(e, item.id, item.company_name || item.contact_person)} title="Delete Vendor" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {addClick && (
                    <div className='modal-overlay' onClick={onClose}>
                        <div className="modal-content vendor-modal" onClick={handleModalClick}>
                            <div className='modal-header'>
                                <h2>Add New Vendor</h2>
                                <button className="close-btn" onClick={onClose}>&times;</button>
                            </div>
                            <form className='modal-form' onSubmit={addVendor}>
                                <div className='form-row'>
                                    <div className='form-group'>
                                        <label>Name</label>
                                        <input type='text' placeholder='e.g Vendor' value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
                                    </div>
                                    <div className='form-group'>
                                        <label>Contact</label>
                                        <input type='text' placeholder='e.g 03001234567' value={contact} onChange={(e) => setContact(e.target.value)} required />
                                    </div>
                                </div>
                                <div className='form-group'>
                                    <label>Current Balance (PKR)</label>
                                    <input type='number' placeholder='0' value={balance} onChange={(e) => setBalance(e.target.value)} required />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="btn-save" disabled={savingVendor}>{savingVendor ? 'Saving...' : 'Save Vendor'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {viewVendor && (
                    <div className="modal-overlay" onClick={closeViewModal}>
                        <div className="modal-content view-modal" onClick={handleModalClick}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="view-modal-title" style={{ textTransform: 'capitalize' }}>{viewVendor.company_name || viewVendor.contact_person}</h2>
                                    <span className="view-modal-subtitle">{viewVendor.phone || 'No Contact Info'} · Vendor ID: {viewVendor.id}</span>
                                </div>
                                <button className="close-btn" onClick={closeViewModal}>&times;</button>
                            </div>
                            <div className="view-modal-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Current Balance</span>
                                    <span className="stat-value">{Number(viewVendor.current_balance).toLocaleString()} PKR</span>
                                </div>
                            </div>
                            {!showLedger ? (
                                <>
                                    <h3 className="view-modal-section-title">Associated Brands</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                        {vendorBrands.length > 0 ? (
                                            vendorBrands.map((brand, i) => (
                                                <span key={i} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '12px', fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{brand}</span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '14px', color: '#64748B' }}>No brands associated yet.</span>
                                        )}
                                    </div>
                                    <h3 className="view-modal-section-title">Purchase History</h3>
                                    <div className="history-table-container">
                                        {vendorPurchases.length > 0 ? (
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Product</th>
                                                        <th>Quantity</th>
                                                        <th style={{ textAlign: 'right' }}>Total Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorPurchases.map((purchase, index) => (
                                                        <tr key={index}>
                                                            <td>{formatDate(purchase.purchase_date)}</td>
                                                            <td>{purchase.product_name}</td>
                                                            <td>{purchase.stock == null ? '-' : `${Number(purchase.stock).toLocaleString()} ${purchase.unit || ''}`}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: '500' }}>{Number(purchase.total_price).toLocaleString()} PKR</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="history-empty">No purchases recorded for this vendor yet.</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="view-modal-section-title">Accounting Ledger</h3>
                                    <div className="history-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        <table className="history-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Description</th>
                                                    <th style={{ textAlign: 'right', color: 'red' }}>Debit (Paid)</th>
                                                    <th style={{ textAlign: 'right', color: 'green' }}>Credit (Owed)</th>
                                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vendorLedger.length > 0 ? (
                                                    vendorLedger.map((txn, index) => (
                                                        <tr key={index}>
                                                            <td>{formatDate(txn.transaction_date)}</td>
                                                            <td>{txn.type}</td>
                                                            <td>{txn.description || '-'}</td>
                                                            <td style={{ textAlign: 'right', color: 'red' }}>{Number(txn.debit_paid) > 0 ? Number(txn.debit_paid).toLocaleString() : '-'}</td>
                                                            <td style={{ textAlign: 'right', color: 'green' }}>{Number(txn.credit_owed) > 0 ? Number(txn.credit_owed).toLocaleString() : '-'}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{txn.balance.toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No ledger entries found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                            <div className="view-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-save btn-toggle" onClick={handleToggleLedger}>{showLedger ? 'View Summary' : 'View Ledger'}</button>
                                <button type="button" className="btn-cancel" onClick={closeViewModal}>Close Record</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}