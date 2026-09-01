import React, { useState, useEffect } from 'react';
import Sidebar from "./Sidebar";
import './Customers.css';
import './Inventory.css';

export default function Customers() {
    const [addClick, toggleAddClick] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [historyData, setHistoryData] = useState({});
    const [historyLoading, setHistoryLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    const [paymentCustomer, setPaymentCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/customers');
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
                const response = await fetch(`http://alifabrics-pos-backend-production.up.railway.app/customers/${customer.id}/history`);
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

    const closeModal = () => {
        setSelectedCustomer(null);
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

    const handleAddPayment = async (e) => {
        e.preventDefault();

        if (!paymentCustomer) return alert("Missing: Customer");
        if (!paymentMethod) return alert("Missing: Payment Method");
        if (!paymentAmount) return alert("Missing: Amount");

        try {
            const response = await fetch('http://alifabrics-pos-backend-production.up.railway.app/add-customer-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: paymentCustomer,
                    method: paymentMethod,
                    amount: paymentAmount
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Payment added and receipt sent via WhatsApp!');
                
                setPaymentCustomer('');
                setPaymentMethod('');
                setPaymentAmount('');
                
                toggleAddClick(false);
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

    const addBtnClick = () => toggleAddClick(!addClick);
    const onClose = () => toggleAddClick(false);
    const handleModalClick = (e) => e.stopPropagation();

    return (
        <div className="inventory-layout">
            <Sidebar />

            <div className="inventory-side">
                <div className="inventory-header">
                    <h1>Customers</h1>
                    <button className='add-product-btn' onClick={addBtnClick}>+ Add Payment</button>
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
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
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
                                            <td>{customer.phone}</td>
                                            <td className="metric-bold" style={{ color: customer.balance_due > 0 ? '#DC2626' : '#16A34A' }}>
                                                {Number(customer.balance_due || 0).toLocaleString()} PKR
                                            </td>
                                            <td className="metric-bold">{Number(customer.total_spent || 0).toLocaleString()} PKR</td>
                                            <td>{customer.total_orders}</td>
                                            <td>{formatDate(customer.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedCustomer && (
                <div className="history-modal-overlay" onClick={closeModal}>
                    <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="history-modal-header">
                            <div>
                                <h2 className="history-modal-title">{selectedCustomer.name}'s Purchase History</h2>
                                <p className="history-modal-subtitle">{selectedCustomer.phone}</p>
                            </div>
                            <button className="close-btn" onClick={closeModal}>&times;</button>
                        </div>

                        <div className="history-modal-body">
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

            {addClick && (
                <div className='modal-overlay' onClick={onClose}>
                    <div className='modal-content' onClick={handleModalClick}>
                        <div className='history-modal-header'>
                            <h2 className="history-modal-title">Add New Customer Payment</h2>
                            <button className="close-btn" onClick={onClose}>&times;</button>
                        </div>

                        <form className="modal-form" onSubmit={handleAddPayment}>
                            <div className='form-row'>
                                <div className="form-group full-width">
                                    <label>Customer Name</label>
                                    <select 
                                        value={paymentCustomer} 
                                        onChange={(e) => setPaymentCustomer(e.target.value)} 
                                        required
                                    >
                                        <option value="" disabled>Select a customer...</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.phone ? `(${c.phone})` : ''} — Owes: {Number(c.balance_due || 0).toLocaleString()} PKR
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                                <button type="submit" className="add-product-btn">Save Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}