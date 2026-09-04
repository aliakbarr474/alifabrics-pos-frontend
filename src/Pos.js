import { useEffect, useState, useRef } from 'react';
import './Pos.css';
import Sidebar from './Sidebar';
import { useReactToPrint } from 'react-to-print';
import Receipt from './Receipt';

export default function Pos() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [activeBankAccounts, setActiveBankAccounts] = useState([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [isWalkingCustomer, setIsWalkingCustomer] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountPaid, setAmountPaid] = useState('');
    const receiptRef = useRef();
    const [currentSaleId, setCurrentSaleId] = useState(null);
    const [currentInvoice, setCurrentInvoice] = useState(null);

    const fetchInventory = () => {
        fetch('https://alifabrics-pos-backend-production.up.railway.app/inventory')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => {});
    };

    const fetchCustomers = () => {
        fetch('https://alifabrics-pos-backend-production.up.railway.app/customers')
            .then(res => res.json())
            .then(data => setCustomers(data))
            .catch(err => {});
    };

    const fetchActiveBankAccounts = () => {
        fetch('https://alifabrics-pos-backend-production.up.railway.app/api/bank-accounts/active')
            .then(res => res.json())
            .then(data => {
                setActiveBankAccounts(data);
                if (data.length > 0) setSelectedBankAccountId(data[0].id);
            })
            .catch(err => {});
    };

    useEffect(() => {
        fetchInventory();
        fetchCustomers();
        fetchActiveBankAccounts();
    }, []);

    const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        switch (filterType) {
            case 'Product Name': return product.productName?.toLowerCase().includes(query);
            case 'Brand': return product.brandName?.toLowerCase().includes(query);
            case 'Category': return product.category?.toLowerCase().includes(query);
            case 'All':
            default:
                return (
                    product.productName?.toLowerCase().includes(query) ||
                    product.brandName?.toLowerCase().includes(query) ||
                    product.category?.toLowerCase().includes(query)
                );
        }
    });

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) {
                alert(`Cannot add more. Only ${product.stock} pieces available in stock.`);
                return;
            }
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            if (product.stock < 1) {
                alert("This item is currently out of stock.");
                return;
            }
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, value) => {
        const product = products.find(p => p.id === id);
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            let newQty = value === '' ? '' : Number(value);
            if (newQty !== '' && newQty > product.stock) {
                alert(`Limit reached. Only ${product.stock} pieces available.`);
                newQty = product.stock;
            }
            setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty } : item));
        }
    };

    const updatePrice = (id, value) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setCart(cart.map(item => item.id === id ? { ...item, sellingPrice: value } : item));
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.sellingPrice || 0) * Number(item.quantity || 0)), 0);
    const netTotal = subtotal - Number(discount);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: "Receipt",
        onAfterPrint: () => {
            setCart([]);
            setDiscount(0);
            setCurrentSaleId(null);
            setCurrentInvoice(null);
            setCustomerName('');
            setCustomerPhone('');
            setSendWhatsApp(false);
            setPaymentMethod('Cash');
            setAmountPaid('');
        }
    });

    const initiateCheckout = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        setAmountPaid(netTotal.toString());
        setShowModal(true);
    };

    const handleCustomerSelect = (e) => {
        const selectedPhone = e.target.value;
        const selectedCustomer = customers.find(c => c.phone === selectedPhone);
        
        if (selectedCustomer) {
            setCustomerName(selectedCustomer.name);
            setCustomerPhone(selectedCustomer.phone);
        } else {
            setCustomerName('');
            setCustomerPhone('');
        }
    };

    const handleFinalCheckout = async () => {
        const finalName = isWalkingCustomer ? '' : customerName;
        const finalPhone = isWalkingCustomer ? '' : customerPhone;
        const finalWhatsApp = isWalkingCustomer ? false : sendWhatsApp;
        const paidAmount = Number(amountPaid) || 0;

        if (paidAmount < netTotal && (!finalName || !finalPhone)) {
            return alert("Customer Name and Phone number are required for credit sales.");
        }

        if (finalWhatsApp && !finalPhone) {
            return alert("Please enter a phone number to send the WhatsApp receipt.");
        }

        if (paymentMethod === 'Bank Transfer' && !selectedBankAccountId) {
            return alert("Please select a bank account for the transfer.");
        }

        try {
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: cart,
                    subtotal: subtotal,
                    discount: discount,
                    customerName: finalName,
                    customerPhone: finalPhone,
                    sendWhatsApp: finalWhatsApp,
                    paymentMethod: paymentMethod,
                    amountPaid: paidAmount,
                    bankAccountId: paymentMethod === 'Bank Transfer' ? selectedBankAccountId : null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentSaleId(data.saleId);
                setCurrentInvoice(data.invoiceNumber);
                setShowModal(false);
                fetchInventory();
                fetchCustomers();

                setTimeout(() => {
                    handlePrint();
                }, 100);
            } else {
                const errorData = await response.json();
                alert(`Checkout failed: ${errorData.message}`);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }
    };

    return (
        <div className="pos-layout">
            <Sidebar />
            <div className="pos-main">
                <div className="pos-products-section">
                    <div className="pos-header">
                        <h1>New Sale</h1>
                        {currentInvoice && <h2>Invoice: {currentInvoice}</h2>}
                    </div>

                    <div className="filter-controls search-filters">
                        <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                            <option value="All">All Fields</option>
                            <option value="Product Name">Product Name</option>
                            <option value="Brand">Brand</option>
                            <option value="Category">Category</option>
                        </select>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <div className="product-card" key={product.id} onClick={() => addToCart(product)}>
                                <div className="product-info">
                                    <h3>{product.productName}</h3>
                                    <span className="brand-tag">{product.brandName || 'N/A'}</span>
                                </div>
                                <div className="product-price">
                                    <strong>{Number(product.sellingPrice || 0).toLocaleString()}</strong> PKR/{product.unit || 'm'}
                                </div>
                                <div className="product-stock">
                                    Stock: {product.stock} {product.unit || 'm'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pos-cart-section">
                    <h2 className="cart-title">Current Order</h2>
                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <p className="empty-cart">Select products to start order.</p>
                        ) : (
                            cart.map(item => (
                                <div className="cart-item" key={item.id}>
                                    <div className="cart-item-details">
                                        <h4>{item.productName}</h4>
                                        <div className="cashier-price-edit">
                                            <input type="text" inputMode="decimal" value={item.sellingPrice || ''} onChange={(e) => updatePrice(item.id, e.target.value)} placeholder="0" className="price-override-input" />
                                            <span>PKR/{item.unit || 'm'}</span>
                                        </div>
                                    </div>
                                    <div className="cart-item-controls">
                                        <button className="qty-btn" onClick={() => {
                                            const newQty = (Number(item.quantity) || 0) - 0.5;
                                            if (newQty <= 0) removeFromCart(item.id);
                                            else updateQuantity(item.id, newQty);
                                        }}>−</button>
                                        <input type="text" inputMode="decimal" value={item.quantity} onChange={(e) => updateQuantity(item.id, e.target.value)} placeholder="0" className="qty-input" />
                                        <button className="qty-btn" onClick={() => updateQuantity(item.id, (Number(item.quantity) || 0) + 0.5)}>+</button>
                                        <span className="qty-unit">{item.unit || 'm'}</span>
                                    </div>
                                    <div className="cart-item-total">
                                        {(Number(item.sellingPrice || 0) * Number(item.quantity || 0)).toLocaleString()}
                                    </div>
                                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="cart-summary">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString()} PKR</span>
                        </div>
                        <div className="summary-row discount-row">
                            <span>Discount (PKR)</span>
                            <input type="text" inputMode="numeric" value={discount || ''} onChange={(e) => {
                                if (e.target.value === '' || /^\d+$/.test(e.target.value)) setDiscount(e.target.value);
                            }} placeholder="0" />
                        </div>
                        <div className="summary-row net-total">
                            <span>Net Total</span>
                            <span>{netTotal.toLocaleString()} PKR</span>
                        </div>
                        <div className="customer-type-toggle">
                            <span className={isWalkingCustomer ? "active-label" : "inactive-label"}>Walk-in</span>
                            <label className="switch">
                                <input type="checkbox" checked={!isWalkingCustomer} onChange={() => setIsWalkingCustomer(!isWalkingCustomer)} />
                                <span className="slider round"></span>
                            </label>
                            <span className={!isWalkingCustomer ? "active-label" : "inactive-label"}>Other</span>
                        </div>
                        <button className="checkout-btn" onClick={initiateCheckout}>Checkout • {netTotal.toLocaleString()} PKR</button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content checkout-modal sleek" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drag-handle"></div>
                        <div className="sleek-modal-header">
                            <div>
                                <h2 className="sleek-modal-title">Payment Method</h2>
                                <p className="sleek-modal-subtitle">Total amount to collect</p>
                            </div>
                            <div className="sleek-amount-badge">
                                {netTotal.toLocaleString()} <span className="currency">PKR</span>
                            </div>
                        </div>
                        
                        <div className="sleek-payment-input-group">
                            <label className="sleek-input-label">Amount Received (PKR)</label>
                            <input type="text" inputMode="numeric" className="sleek-input amount-received-input" value={amountPaid} onChange={(e) => {
                                if (e.target.value === '' || /^\d+$/.test(e.target.value)) setAmountPaid(e.target.value);
                            }} />
                            {(Number(amountPaid) < netTotal) && (
                                <div className="credit-alert">
                                    Adding to Credit Balance: {(netTotal - Number(amountPaid)).toLocaleString()} PKR
                                </div>
                            )}
                        </div>

                        <div className="sleek-segmented-control">
                            <div className={`segment ${paymentMethod === 'Cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash')}>Cash</div>
                            <div className={`segment ${paymentMethod === 'Bank Transfer' ? 'active' : ''}`} onClick={() => setPaymentMethod('Bank Transfer')}>Bank Transfer</div>
                        </div>

                        {paymentMethod === 'Bank Transfer' && (
                            <div className="bank-selection-group">
                                <label className="sleek-input-label">Select Bank Account</label>
                                <select 
                                    className="sleek-input" 
                                    value={selectedBankAccountId} 
                                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                >
                                    <option value="" disabled>-- Choose Account --</option>
                                    {activeBankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.bank_name} - {acc.account_title}
                                        </option>
                                    ))}
                                </select>
                                
                                {activeBankAccounts.find(acc => String(acc.id) === String(selectedBankAccountId))?.qr_code && (
                                    <button 
                                        className="btn-show-qr"
                                        onClick={() => setShowQRModal(true)}
                                    >
                                        Show QR to Customer
                                    </button>
                                )}
                            </div>
                        )}

                        {(!isWalkingCustomer || (Number(amountPaid) < netTotal)) && (
                            <div className="sleek-customer-fields">
                                <select className="sleek-input" onChange={handleCustomerSelect}>
                                    <option value="">-- Select Existing Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.phone}>{c.name} - {c.phone}</option>
                                    ))}
                                </select>
                                <input type="text" className="sleek-input" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                <input type="tel" className="sleek-input" placeholder="WhatsApp / Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                <label className="sleek-checkbox-wrapper">
                                    <input type="checkbox" className="sleek-checkbox" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} />
                                    <span className="checkbox-text">Send digital receipt via WhatsApp</span>
                                </label>
                            </div>
                        )}
                        <button className="sleek-confirm-btn" onClick={handleFinalCheckout}>Confirm Sale</button>
                    </div>
                </div>
            )}

            {showQRModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowQRModal(false)}>
                    <div className="modal-content qr-display-modal sleek" onClick={(e) => e.stopPropagation()}>
                        <div className="sleek-modal-header" style={{ marginBottom: '16px' }}>
                            <h2 className="sleek-modal-title">Scan to Pay</h2>
                            <button className="close-btn qr-close-btn" onClick={() => setShowQRModal(false)}>&times;</button>
                        </div>
                        
                        {activeBankAccounts.filter(acc => String(acc.id) === String(selectedBankAccountId)).map(acc => (
                            <div key={acc.id} className="qr-large-container">
                                <img 
                                    src={acc.qr_code} 
                                    alt="QR Code" 
                                    className="qr-large-image"
                                />
                                <h3 className="qr-large-title">{acc.account_title}</h3>
                                <p className="qr-large-bank">{acc.bank_name}</p>
                                <p className="qr-large-acc">{acc.account_number}</p>
                                
                                <div className="qr-large-amount">
                                    Total Due: {netTotal.toLocaleString()} PKR
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'none' }}>
                <Receipt ref={receiptRef} cart={cart} subtotal={subtotal} discount={discount} netTotal={netTotal} saleId={currentSaleId} invoiceNumber={currentInvoice} amountPaid={amountPaid} />
            </div>
        </div>
    );
}