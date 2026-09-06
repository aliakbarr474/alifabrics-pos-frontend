import React, { useState, useEffect } from 'react';
import Sidebar from "./Sidebar";
import './Customers.css';
import './Inventory.css';

export default function Customers() {
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [historyData, setHistoryData] = useState({});
    const [historyLoading, setHistoryLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/customers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setCustomers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleRowClick = async (customer) => {
        setSelectedCustomer(customer);

        if (!historyData[customer.id]) {
            setHistoryLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://alifabrics-pos-backend-production.up.railway.app/customers/${customer.id}/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch history');
                const data = await response.json();

                setHistoryData(prev => ({
                    ...prev,
                    [customer.id]: data
                }));
            } catch (err) {
                console.error(err);
            } finally {
                setHistoryLoading(false);
            }
        }
    };

    const handleDeleteCustomer = async (e, customerId, customerName) => {
        e.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://alifabrics-pos-backend-production.up.railway.app/customers/${customerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                alert('Customer deleted successfully.');
                fetchCustomers();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the server.');
        }
    };

    const closeHistoryModal = () => {
        setSelectedCustomer(null);
        setIsPaymentOpen(false);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleNumberChange = (e, setter) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        
        if (!newCustomerName) return alert("Missing: Customer Name");

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/customers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCustomerName,
                    phone: newCustomerPhone
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Customer added successfully!');
                setNewCustomerName('');
                setNewCustomerPhone('');
                setIsAddCustomerOpen(false);
                fetchCustomers();
            } else {
                alert(`Backend Error: ${data.message || 'Failed to add customer'}`);
            }
        } catch (error) {
            alert('Failed to connect to the server.');
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();

        if (!selectedCustomer) return alert("Missing: Customer Context");
        if (!paymentMethod) return alert("Missing: Payment Method");
        if (!paymentAmount) return alert("Missing: Amount");

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/add-customer-payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    method: paymentMethod,
                    amount: paymentAmount
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Payment added and receipt sent via WhatsApp!');
                setPaymentMethod('');
                setPaymentAmount('');
                setIsPaymentOpen(false);
                
                fetchCustomers();
            } else {
                alert(`Backend Error: ${data.message}`);
            }
        } catch (error) {
            alert('Failed to connect to the server.');
        }
    };

    const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((customer) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();

        switch (filterType) {
            case 'Customer Name':
                return customer.name?.toLowerCase().includes(query);
            case 'Phone':
                return customer.phone?.toLowerCase().includes(query);
            case 'Total Orders':
                return customer.total_orders?.toString().includes(query);
            case 'Balance Due':
                return customer.balance_due?.toString().includes(query);
            case 'All':
            default:
                return (
                    customer.name?.toLowerCase().includes(query) ||
                    customer.phone?.toLowerCase().includes(query) ||
                    customer.total_orders?.toString().includes(query) ||
                    customer.total_spent?.toString().includes(query) ||
                    customer.balance_due?.toString().includes(query)
                );
        }
    });

    return (
        <div className="inventory-layout">
            <Sidebar />

            <div className="inventory-side">
                <div className="inventory-header">
                    <h1>Customers</h1>
                    <button className='add-product-btn' onClick={() => setIsAddCustomerOpen(true)}>
                        + Add New Customer
                    </button>
                </div>

                <div className="filter-controls">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="All">All Fields</option>
                        <option value="Customer Name">Customer Name</option>
                        <option value="Phone">Phone</option>
                        <option value="Balance Due">Balance Due</option>
                        <option value="Total Orders">Total Orders</option>
                    </select>
                </div>

                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-state">Loading customer data...</div>
                    ) : error ? (
                        <div className="error-state">Error loading customers: {error}</div>
                    ) : (
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Phone</th>
                                    <th>Balance Due</th>
                                    <th>Lifetime Spent</th>
                                    <th>Total Orders</th>
                                    <th>Added On</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            {customers.length === 0 ? 'No customers found.' : 'No customers match your search.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="clickable-row"
                                            onClick={() => handleRowClick(customer)}
                                        >
                                            <td className="customer-name">{customer.name}</td>
                                            <td>{customer.phone || 'N/A'}</td>
                                            <td className="metric-bold" style={{ color: customer.balance_due > 0 ? '#DC2626' : '#16A34A' }}>
                                                {Number(customer.balance_due || 0).toLocaleString()} PKR
                                            </td>
                                            <td className="metric-bold">{Number(customer.total_spent || 0).toLocaleString()} PKR</td>
                                            <td>{customer.total_orders}</td>
                                            <td>{formatDate(customer.created_at)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    className="remove-btn" 
                                                    onClick={(e) => handleDeleteCustomer(e, customer.id, customer.name)}
                                                    title="Delete Customer"
                                                    style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedCustomer && (
                <div className="history-modal-overlay" onClick={closeHistoryModal}>
                    <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="history-modal-header header-actions">
                            <div>
                                <h2 className="history-modal-title">{selectedCustomer.name}'s Details</h2>
                                <p className="history-modal-subtitle">{selectedCustomer.phone || 'No phone'} | Balance: {Number(selectedCustomer.balance_due || 0).toLocaleString()} PKR</p>
                            </div>
                            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                <button className="add-product-btn" onClick={() => setIsPaymentOpen(true)}>
                                    Make Payment
                                </button>
                                <button className="close-btn" onClick={closeHistoryModal}>&times;</button>
                            </div>
                        </div>

                        <div className="history-modal-body">
                            {isPaymentOpen ? (
                                <form className="modal-form" onSubmit={handleAddPayment} style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                                    <h3 style={{marginTop: 0}}>Process Payment</h3>
                                    <div className='form-row'>
                                        <div className="form-group">
                                            <label>Payment Method</label>
                                            <select 
                                                value={paymentMethod} 
                                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                                required
                                            >
                                                <option value="" disabled>Select method...</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Bank">Bank</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Amount (PKR)</label>
                                            <input 
                                                type="text" 
                                                inputMode="decimal" 
                                                placeholder="0"
                                                value={paymentAmount} 
                                                onChange={(e) => handleNumberChange(e, setPaymentAmount)} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer" style={{marginTop: '10px'}}>
                                        <button type="button" className="btn-cancel" onClick={() => setIsPaymentOpen(false)}>Cancel</button>
                                        <button type="submit" className="add-product-btn">Submit Payment</button>
                                    </div>
                                </form>
                            ) : null}

                            <h3 style={{marginBottom: '10px'}}>Purchase History</h3>
                            {historyLoading && !historyData[selectedCustomer.id] ? (
                                <p className="history-loading">Loading receipts...</p>
                            ) : historyData[selectedCustomer.id]?.length === 0 ? (
                                <p className="history-empty">No purchases found for this customer.</p>
                            ) : (
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Receipt No.</th>
                                            <th>Date</th>
                                            <th>Items Bought</th>
                                            <th className="align-right">Total Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyData[selectedCustomer.id]?.map(receipt => (
                                            <tr key={receipt.receipt_no}>
                                                <td className="receipt-id">#{receipt.receipt_no}</td>
                                                <td>{formatDate(receipt.sale_date)}</td>
                                                <td className="items-list">{receipt.items_bought || 'N/A'}</td>
                                                <td className="metric-bold align-right">
                                                    {receipt.net_total?.toLocaleString()} PKR
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAddCustomerOpen && (
                <div className='modal-overlay' onClick={() => setIsAddCustomerOpen(false)}>
                    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                        <div className='history-modal-header'>
                            <h2 className="history-modal-title">Add New Customer</h2>
                            <button className="close-btn" onClick={() => setIsAddCustomerOpen(false)}>&times;</button>
                        </div>

                        <form className="modal-form" onSubmit={handleAddCustomer}>
                            <div className='form-row'>
                                <div className="form-group full-width">
                                    <label>Customer Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter customer name"
                                        value={newCustomerName} 
                                        onChange={(e) => setNewCustomerName(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className="form-group full-width">
                                    <label>Phone Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter phone number"
                                        value={newCustomerPhone} 
                                        onChange={(e) => setNewCustomerPhone(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddCustomerOpen(false)}>Cancel</button>
                                <button type="submit" className="add-product-btn">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}