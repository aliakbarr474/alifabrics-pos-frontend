import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function Accounts() {
    const [addClick, toggleAddClick] = useState(false);

    const addBtnClick = () => toggleAddClick(!addClick);
    const handleModalClick = (e) => e.stopPropagation();

    const onClose = () => {
        toggleAddClick(false);
        setAmount("");
        setMethod("");
        setDescription("");
        setSelectedVendor("");
    };

    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [description, setDescription] = useState("");

    const [selectedVendor, setSelectedVendor] = useState("");
    const [vendorList, setVendorList] = useState([]);

    const [payments, setPayments] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('https://alifabrics-pos-backend-production.up.railway.app/vendors', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setVendorList(data);
                else setVendorList([]);
            })
            .catch(err => console.error("Error fetching vendors: ", err));
    }, []);

    const fetchPayments = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/get-payments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();

            if (result.success) {
                setPayments(result.data);
            } else {
                console.error("Backend error:", result.message);
            }
        } catch (error) {
            console.error('Error occurred fetching payments: ', error);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const addPayment = async (e) => {
        e.preventDefault();

        if (!amount) return alert('Enter a valid amount');
        if (!method) return alert('Select a valid method');
        if (!selectedVendor) return alert('Select a valid vendor');

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/add-payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    method,
                    vendor_id: selectedVendor,
                    description
                })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                fetchPayments();
                onClose();
            } else {
                alert(data.message || 'Failed to add payment');
            }

        } catch (error) {
            console.error('Error occurred: ', error);
            alert('A network error occurred while adding the payment.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <div className='inventory-layout'>
            <Sidebar />

            <div className='inventory-side'>
                <div className='inventory-header'>
                    <h1>Accounts</h1>
                    <button className='add-product-btn' onClick={addBtnClick}>+ Add Payment</button>
                </div>

                <div className='table-wrapper'>
                    <table className='inventory-table'>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <tr key={payment.id} className='inventory-table-row'>
                                        <td>
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>{payment.vendor_name}</td>
                                        <td>Rs.{payment.amount}</td>
                                        <td>{payment.method}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{payment.description || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No payments recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {addClick && (
                <div className='modal-overlay' onClick={onClose}>
                    <div className='modal-content vendor-modal' onClick={handleModalClick}>
                        <div className='modal-header'>
                            <h2>Add New Payment</h2>
                            <button className="close-btn" onClick={onClose}>&times;</button>
                        </div>

                        <form className='modal-form' onSubmit={addPayment}>
                            <div className='form-group'>
                                <label>Amount</label>
                                <input type='number' placeholder='e.g 100'
                                    value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Method</label>
                                    <select
                                        required
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                    >
                                        <option value="" disabled>Select a method...</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>

                                <div className='form-group'>
                                    <label>Vendor</label>
                                    <select
                                        value={selectedVendor}
                                        onChange={(e) => setSelectedVendor(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select a vendor...</option>
                                        {(Array.isArray(vendorList) ? vendorList : []).map((v) => {
                                            const displayName = v.company_name || v.contact_person || `Vendor #${v.id}`;
                                            return (
                                                <option key={v.id} value={v.id}>{displayName}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className='form-group'>
                                <label>Description</label>
                                <input type='text' placeholder='e.g Payment for supplies'
                                    value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-save">Save Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}