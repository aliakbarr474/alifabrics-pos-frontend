import React, { forwardRef } from 'react';
import './Receipt.css';

const Receipt = forwardRef(({ cart, subtotal, discount, netTotal, saleId, invoiceNumber, amountPaid }, ref) => {
    const paid = Number(amountPaid) || 0;
    const balance = netTotal - paid;

    return (
        <div className="receipt-wrapper">
            <div ref={ref} className="receipt-content">
                <div className="receipt-header">
                    <h2>Ali Fabrics</h2>
                    <p>Invoice: {invoiceNumber || 'N/A'}</p>
                    <p className="sale-id">Sale ID: {saleId}</p>
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-items">
                    {cart.map((item, index) => (
                        <div key={index} className="receipt-item-row">
                            <span>{item.productName} ({item.quantity}{item.unit || 'm'})</span>
                            <span>{(Number(item.sellingPrice) * Number(item.quantity)).toLocaleString()} PKR</span>
                        </div>
                    ))}
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>{subtotal.toLocaleString()} PKR</span>
                </div>
                <div className="summary-line">
                    <span>Discount:</span>
                    <span>{Number(discount).toLocaleString()} PKR</span>
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="summary-line net-total">
                    <span>Total:</span>
                    <span>{netTotal.toLocaleString()} PKR</span>
                </div>

                <div className="summary-line paid-amount">
                    <span>Amount Paid:</span>
                    <span>{paid.toLocaleString()} PKR</span>
                </div>

                {balance > 0 && (
                    <div className="summary-line balance-due">
                        <span>Balance Due:</span>
                        <span>{balance.toLocaleString()} PKR</span>
                    </div>
                )}
                
                <div className="receipt-footer">
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>
        </div>
    );
});

export default Receipt;