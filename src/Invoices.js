import { useEffect, useState, useRef } from 'react';
import './Invoices.css';
import Sidebar from './Sidebar';
import { useReactToPrint } from 'react-to-print';
import Receipt from './Receipt';

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const receiptRef = useRef();

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnInvoice, setReturnInvoice] = useState(null);
    const [returnItemsList, setReturnItemsList] = useState([]);

    useEffect(() => {
        fetch('https://alifabrics-pos-backend-production.up.railway.app/invoices')
            .then(res => res.json())
            .then(data => setInvoices(data))
            .catch(err => console.error(err));
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: selectedInvoice ? `Invoice_${selectedInvoice.invoice_number}` : "Invoice"
    });

    const generatePDF = async (invoice) => {
        try {
            const res = await fetch(`https://alifabrics-pos-backend-production.up.railway.app/invoices/${invoice.id}/items`);
            if (res.ok) {
                const items = await res.json();
                setSelectedInvoice(invoice);
                setInvoiceItems(items);
                setTimeout(() => {
                    handlePrint();
                }, 300);
            }
        } catch (error) {
            alert("Failed to fetch invoice details.");
        }
    };

    const openReturnModal = async (invoice) => {
        try {
            const res = await fetch(`https://alifabrics-pos-backend-production.up.railway.app/invoices/${invoice.id}/items`);
            if (res.ok) {
                const items = await res.json();
                setReturnInvoice(invoice);
                setReturnItemsList(items.map(item => ({ ...item, returnQty: 0 })));
                setShowReturnModal(true);
            }
        } catch (error) {
            alert("Failed to fetch invoice details.");
        }
    };

    const handleReturnQtyChange = (itemId, val, maxQty) => {
        let num = Number(val);
        if (num > maxQty) num = maxQty;
        if (num < 0) num = 0;
        
        setReturnItemsList(prev => prev.map(item => 
            item.id === itemId ? { ...item, returnQty: num } : item
        ));
    };

    const submitReturn = async () => {
        const itemsToReturn = returnItemsList.filter(item => item.returnQty > 0);
        if (itemsToReturn.length === 0) return alert("Select at least one item to return.");

        const totalRefund = itemsToReturn.reduce((sum, item) => sum + (item.returnQty * item.sellingPrice), 0);

        try {
            const res = await fetch('https://alifabrics-pos-backend-production.up.railway.app/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    saleId: returnInvoice.id,
                    customerId: returnInvoice.customer_id,
                    returnItems: itemsToReturn.map(item => ({
                        itemId: item.id,
                        quantity: item.returnQty,
                        refundAmount: item.returnQty * item.sellingPrice
                    })),
                    totalRefund: totalRefund
                })
            });

            if (res.ok) {
                setShowReturnModal(false);
                alert("Return processed successfully!");
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            alert("Failed to connect to server.");
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!searchTerm) return true;
        return inv.invoice_number && inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="invoices-layout">
            <Sidebar />
            
            <div className="invoices-side">
                <div className="invoices-header">
                    <h1>Invoices</h1>
                    <input 
                        type="text" 
                        placeholder="Search invoice number..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="table-wrapper">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>Invoice No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Net Total</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="invoices-table-row">
                                    <td style={{ fontWeight: '600' }}>{inv.invoice_number}</td>
                                    <td>{new Date(inv.sale_date).toLocaleString()}</td>
                                    <td>{inv.customer_name || 'Walk-in'}</td>
                                    <td>{inv.net_total.toLocaleString()} PKR</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons">
                                            <button 
                                                className="return-btn"
                                                onClick={() => openReturnModal(inv)}
                                            >
                                                Return
                                            </button>
                                            <button 
                                                className="pdf-btn"
                                                onClick={() => generatePDF(inv)}
                                            >
                                                View PDF
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        No invoices found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showReturnModal && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="view-modal-title">Return Items</h2>
                                <span className="view-modal-subtitle">Invoice: {returnInvoice?.invoice_number}</span>
                            </div>
                            <button className="close-btn" onClick={() => setShowReturnModal(false)}>✕</button>
                        </div>
                        <div className="modal-form" style={{ padding: '24px' }}>
                            <div className="history-table-container" style={{ maxHeight: '400px' }}>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Price</th>
                                            <th>Bought</th>
                                            <th>Return Qty</th>
                                            <th>Refund</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItemsList.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.productName}</td>
                                                <td>{item.sellingPrice}</td>
                                                <td>{item.quantity} {item.unit}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="return-qty-input"
                                                        value={item.returnQty === 0 ? '' : item.returnQty}
                                                        onChange={(e) => handleReturnQtyChange(item.id, e.target.value, item.quantity)}
                                                        placeholder="0"
                                                        max={item.quantity}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 'bold' }}>
                                                    {(item.returnQty * item.sellingPrice).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '20px 24px' }}>
                            <label style={{ marginRight: 'auto' }}>
                                Total Refund: {returnItemsList.reduce((sum, item) => sum + (item.returnQty * item.sellingPrice), 0).toLocaleString()} PKR
                            </label>
                            <button className="btn-cancel" onClick={() => setShowReturnModal(false)} style={{ width: 'auto' }}>Cancel</button>
                            <button className="btn-save return-confirm-btn" onClick={submitReturn} style={{ width: 'auto', backgroundColor: '#EF4444', color: '#fff' }}>Confirm Return</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedInvoice && (
                <Receipt 
                    ref={receiptRef} 
                    cart={invoiceItems} 
                    subtotal={selectedInvoice.total_amount} 
                    discount={selectedInvoice.discount} 
                    netTotal={selectedInvoice.net_total} 
                    saleId={selectedInvoice.id} 
                    invoiceNumber={selectedInvoice.invoice_number} 
                />
            )}
        </div>
    );
}