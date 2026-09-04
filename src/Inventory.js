import { useEffect, useState } from 'react';
import './Inventory.css'
import Sidebar from './Sidebar'

export default function Inventory() {
    const [addClick, toggleAddClick] = useState(false);

    const [vendorList, setVendorList] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [isNewVendor, setIsNewVendor] = useState(false);
    const [customVendorName, setCustomVendorName] = useState('');
    const [customVendorPhone, setCustomVendorPhone] = useState('');
    const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

    const [brandList, setBrandList] = useState([]);
    const [categoryList, setCategoryList] = useState(['Wash & Wear', 'Mix Cotton', 'Cotton']);
    const [unitList, setUnitList] = useState([]);

    const [inventoryData, setInventoryData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    const [viewProduct, setViewProduct] = useState(null);
    const [productHistory, setProductHistory] = useState([]);

    const initialItem = {
        productName: '',
        selectedBrand: '',
        isNewBrand: false,
        customBrandName: '',
        selectedCategory: '',
        isNewCategory: false,
        customCategoryName: '',
        categoryMessage: '',
        selectedUnit: '',
        isNewUnit: false,
        customUnitName: '',
        unitMessage: '',
        quantity: '',
        unitPrice: '',
        sellingPrice: '',
        totalPrice: 0
    };

    const [items, setItems] = useState([{ ...initialItem }]);

    const fetchInventory = async () => {
        try {
            const res = await fetch('https://alifabrics-pos-backend-production.up.railway.app/inventory');
            const data = await res.json();
            if (Array.isArray(data)) {
                setInventoryData(data);
            } else {
                setInventoryData([]);
            }
        } catch (err) {
            setInventoryData([]);
        }
    };

    useEffect(() => {
        fetch('https://alifabrics-pos-backend-production.up.railway.app/vendors')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setVendorList(data);
                else setVendorList([]);
            });

        fetchInventory();
    }, []);

    useEffect(() => {
        const fallbackBrands = [...new Set(inventoryData.map(item => item.brandName).filter(Boolean))]
            .map((name, i) => ({ id: `fallback-${i}`, name }));

        if (selectedVendor && !isNewVendor) {
            fetch(`https://alifabrics-pos-backend-production.up.railway.app/vendors/${encodeURIComponent(selectedVendor)}/brands`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setBrandList(data);
                    } else {
                        setBrandList(fallbackBrands);
                    }
                })
                .catch(err => {
                    setBrandList(fallbackBrands);
                });
        } else {
            setBrandList(fallbackBrands);
        }
    }, [selectedVendor, isNewVendor, inventoryData]);

    useEffect(() => {
        if (inventoryData.length > 0) {
            const dbCategories = inventoryData.map(item => item.category).filter(Boolean);
            const dbUnits = inventoryData.map(item => item.unit).filter(Boolean);

            setCategoryList(prev => [...new Set([...prev, ...dbCategories])]);
            setUnitList(prev => [...new Set([...prev, ...dbUnits])]);
        }
    }, [inventoryData]);

    const handleNumberChange = (index, field, value) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            handleItemChange(index, field, value);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'customCategoryName') {
            if (categoryList.some(c => c.toLowerCase() === value.toLowerCase().trim())) {
                newItems[index].categoryMessage = 'This category already exists. Please select it from the dropdown.';
            } else {
                newItems[index].categoryMessage = '';
            }
        }

        if (field === 'customUnitName') {
            if (unitList.some(u => u.toLowerCase() === value.toLowerCase().trim())) {
                newItems[index].unitMessage = 'This unit already exists. Please select it from the dropdown.';
            } else {
                newItems[index].unitMessage = '';
            }
        }

        if (field === 'quantity' || field === 'unitPrice') {
            const qty = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0;
            const price = parseFloat(field === 'unitPrice' ? value : newItems[index].unitPrice) || 0;
            newItems[index].totalPrice = qty * price;
        }

        setItems(newItems);
    };

    const addNewRow = () => {
        setItems([...items, { ...initialItem }]);
    };

    const removeRow = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const addBtnClick = () => toggleAddClick(!addClick);
    
    const onClose = () => {
        toggleAddClick(false);
        setItems([{ ...initialItem }]);
        setSelectedVendor('');
        setIsNewVendor(false);
        setCustomVendorName('');
        setCustomVendorPhone('');
        setVendorInvoiceNumber('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
    };
    
    const handleModalClick = (e) => e.stopPropagation();

    const handleRowClick = async (item) => {
        setViewProduct(item);
        setProductHistory([]);

        try {
            const response = await fetch(`https://alifabrics-pos-backend-production.up.railway.app/inventory/${item.id}/history`);
            if (response.ok) {
                const historyData = await response.json();
                setProductHistory(historyData);
            }
        } catch (error) {
        }
    };

    const closeViewModal = () => {
        setViewProduct(null);
    };

    const addProduct = async (e) => {
        e.preventDefault();

        for (const item of items) {
            if (item.categoryMessage || item.unitMessage) {
                alert("Please resolve the duplicate errors before saving.");
                return;
            }
        }

        const finalVendorName = isNewVendor 
            ? customVendorName.trim() 
            : (typeof selectedVendor === 'object' && selectedVendor !== null ? (selectedVendor.contact_person || selectedVendor.company_name) : selectedVendor);

        if (!finalVendorName) return alert("Missing: Vendor");

        const formattedItems = items.map(item => {
            const finalBrandName = item.isNewBrand ? item.customBrandName.trim() : item.selectedBrand;
            const finalCategoryName = item.isNewCategory ? item.customCategoryName.trim() : item.selectedCategory;
            const finalUnitName = item.isNewUnit ? item.customUnitName.trim() : item.selectedUnit;

            return {
                productName: item.productName,
                brand: finalBrandName,
                category: finalCategoryName,
                unit: finalUnitName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                sellingPrice: item.sellingPrice,
                total: item.totalPrice
            };
        });

        for (let i = 0; i < formattedItems.length; i++) {
            const item = formattedItems[i];
            if (!item.productName) return alert(`Item ${i + 1}: Missing Product Name`);
            if (!item.brand) return alert(`Item ${i + 1}: Missing Brand`);
            if (!item.category) return alert(`Item ${i + 1}: Missing Category`);
            if (!item.unit) return alert(`Item ${i + 1}: Missing Unit`);
            if (!item.quantity) return alert(`Item ${i + 1}: Missing Quantity`);
            if (!item.unitPrice) return alert(`Item ${i + 1}: Missing Unit Cost Price`);
            if (!item.sellingPrice) return alert(`Item ${i + 1}: Missing Selling Price`);
        }

        try {
            const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/add-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorName: finalVendorName,
                    vendorPhone: isNewVendor ? customVendorPhone.trim() : null,
                    vendorInvoiceNumber: vendorInvoiceNumber.trim(),
                    purchaseDate: purchaseDate,
                    items: formattedItems
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Products added successfully!');

                setItems([{ ...initialItem }]);
                setSelectedVendor(''); setCustomVendorName(''); setCustomVendorPhone(''); setIsNewVendor(false);
                setVendorInvoiceNumber(''); setPurchaseDate(new Date().toISOString().split('T')[0]);
                
                toggleAddClick(false);
                fetchInventory();
                
                fetch('https://alifabrics-pos-backend-production.up.railway.app/vendors')
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setVendorList(data);
                    });
            } else {
                alert(`Backend Error: ${data.message}`);
            }

        } catch (error) {
            alert('Failed to connect to the server. Is your backend running?');
        }
    }

    const filteredInventory = (Array.isArray(inventoryData) ? inventoryData : []).filter((item) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();

        switch (filterType) {
            case 'Product Name':
                return item.productName?.toLowerCase().includes(query);
            case 'Brand':
                return item.brandName?.toLowerCase().includes(query);
            case 'Category':
                return item.category?.toLowerCase().includes(query);
            case 'All':
            default:
                return (
                    item.productName?.toLowerCase().includes(query) ||
                    item.brandName?.toLowerCase().includes(query) ||
                    item.vendorName?.toLowerCase().includes(query) ||
                    item.category?.toLowerCase().includes(query)
                );
        }
    });

    return (
        <div className='inventory-layout'>
            <Sidebar />

            <div className='inventory-side'>
                <div className='inventory-header'>
                    <h1>Inventory</h1>
                    <button className='add-product-btn' onClick={addBtnClick}>New Purchase</button>
                </div>

                <div className="filter-controls-container">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-box"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select-box"
                    >
                        <option value="All">All Fields</option>
                        <option value="Product Name">Product Name</option>
                        <option value="Brand">Brand</option>
                        <option value="Category">Category</option>
                    </select>
                </div>

                <div className='table-wrapper'>
                    <table className='inventory-table'>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Cost Price</th>
                                <th>Selling Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="inventory-table-row" onClick={() => handleRowClick(item)}>
                                        <td><strong>{item.productName}</strong></td>
                                        <td>{item.brandName || 'N/A'}</td>
                                        <td>{item.category}</td>
                                        <td>
                                            <span className={Number(item.stock) === 0 ? 'stock out' : 'stock in'}>
                                                {Number(item.stock) > 0 ? `${item.stock} ${item.unit || 'meters'}` : 'Out of stock'}
                                            </span>
                                        </td>
                                        <td>PKR {Number(item.unitPrice).toLocaleString()}</td>
                                        <td>PKR {Number(item.sellingPrice).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-table-cell">
                                        {inventoryData.length === 0 ? 'No inventory found. Add a product to get started!' : 'No items match your search.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {addClick && (
                    <div className="modal-overlay" onClick={onClose}>
                        <div className="modal-content modal-content-wide" onClick={handleModalClick}>
                            <div className="modal-header">
                                <h2>Add New Products</h2>
                                <button className="close-btn" onClick={onClose}>&times;</button>
                            </div>

                            <form className="modal-form">
                                <div className="form-row form-row-margin">
                                    <div className="form-group vendor-group-max">
                                        <label>Vendor (Supplier)</label>
                                        {isNewVendor ? (
                                            <div className="new-vendor-container">
                                                <div className="new-vendor-input-group">
                                                    <input type="text" placeholder="Enter new vendor name"
                                                        value={customVendorName} onChange={(e) => setCustomVendorName(e.target.value)} required />
                                                    <button type="button" className="btn-secondary close-icon-btn"
                                                        onClick={() => {
                                                            setIsNewVendor(false);
                                                            setCustomVendorName('');
                                                            setCustomVendorPhone('');
                                                        }}>✕</button>
                                                </div>
                                                <input type="text" placeholder="Phone Number (Optional)"
                                                    value={customVendorPhone} onChange={(e) => setCustomVendorPhone(e.target.value)} />
                                            </div>
                                        ) : (
                                            <select value={selectedVendor} onChange={(e) => {
                                                if (e.target.value === "ADD_NEW") {
                                                    setIsNewVendor(true);
                                                    setSelectedVendor('');
                                                } else {
                                                    setSelectedVendor(e.target.value);
                                                }
                                            }} required>
                                                <option value="" disabled>Select a vendor...</option>
                                                {(Array.isArray(vendorList) ? vendorList : []).map((v) => {
                                                    const displayName = v.company_name || v.contact_person || `Vendor #${v.id}`;
                                                    return (
                                                        <option key={v.id} value={displayName}>{displayName}</option>
                                                    )
                                                })}
                                                <option disabled>──────────</option>
                                                <option value="ADD_NEW">➕ Add New Vendor...</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Vendor Invoice #</label>
                                        <input
                                            type="text"
                                            placeholder="INV-0000"
                                            value={vendorInvoiceNumber}
                                            onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date Received</label>
                                        <input
                                            type="date"
                                            value={purchaseDate}
                                            onChange={(e) => setPurchaseDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="table-wrapper visible-overflow table-margin">
                                    <table className="inventory-table">
                                        <thead>
                                            <tr>
                                                <th>Product Name</th>
                                                <th>Brand</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th>Qty</th>
                                                <th>Cost Price</th>
                                                <th>Sell Price</th>
                                                <th>Total (PKR)</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="grid-td-pad">
                                                        <input 
                                                            type="text" 
                                                            className="grid-input" 
                                                            placeholder="e.g. 24 Karat"
                                                            value={item.productName} 
                                                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)} 
                                                            required 
                                                        />
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        {item.isNewBrand ? (
                                                            <div className="custom-input-group">
                                                                <input 
                                                                    type="text" 
                                                                    className="grid-input" 
                                                                    placeholder="New Brand"
                                                                    value={item.customBrandName} 
                                                                    onChange={(e) => handleItemChange(index, 'customBrandName', e.target.value)} 
                                                                    required 
                                                                />
                                                                <button type="button" className="btn-secondary close-icon-btn" onClick={() => {
                                                                    handleItemChange(index, 'isNewBrand', false);
                                                                    handleItemChange(index, 'customBrandName', '');
                                                                }}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <select className="grid-input" value={item.selectedBrand} onChange={(e) => {
                                                                if (e.target.value === "ADD_NEW") {
                                                                    handleItemChange(index, 'isNewBrand', true);
                                                                    handleItemChange(index, 'selectedBrand', '');
                                                                } else {
                                                                    handleItemChange(index, 'selectedBrand', e.target.value);
                                                                }
                                                            }} required>
                                                                <option value="" disabled>Select...</option>
                                                                {brandList.map((b, i) => {
                                                                    const bName = typeof b === 'string' ? b : b.name;
                                                                    return <option key={i} value={bName}>{bName}</option>;
                                                                })}
                                                                <option disabled>──────</option>
                                                                <option value="ADD_NEW">➕ New Brand</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        {item.isNewCategory ? (
                                                            <div className="custom-input-group">
                                                                <input 
                                                                    type="text" 
                                                                    className="grid-input" 
                                                                    placeholder="New Category"
                                                                    value={item.customCategoryName} 
                                                                    onChange={(e) => handleItemChange(index, 'customCategoryName', e.target.value)} 
                                                                    required 
                                                                />
                                                                <button type="button" className="btn-secondary close-icon-btn" onClick={() => {
                                                                    handleItemChange(index, 'isNewCategory', false);
                                                                    handleItemChange(index, 'customCategoryName', '');
                                                                    handleItemChange(index, 'categoryMessage', '');
                                                                }}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <select className="grid-input" value={item.selectedCategory} onChange={(e) => {
                                                                if (e.target.value === "ADD_NEW") {
                                                                    handleItemChange(index, 'isNewCategory', true);
                                                                    handleItemChange(index, 'selectedCategory', '');
                                                                } else {
                                                                    handleItemChange(index, 'selectedCategory', e.target.value);
                                                                }
                                                            }} required>
                                                                <option value="" disabled>Select...</option>
                                                                {categoryList.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                                                <option disabled>──────</option>
                                                                <option value="ADD_NEW">➕ New Category</option>
                                                            </select>
                                                        )}
                                                        {item.categoryMessage && <span className="error-text block-mt">{item.categoryMessage}</span>}
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        {item.isNewUnit ? (
                                                            <div className="custom-input-group">
                                                                <input 
                                                                    type="text" 
                                                                    className="grid-input" 
                                                                    placeholder="New Unit"
                                                                    value={item.customUnitName} 
                                                                    onChange={(e) => handleItemChange(index, 'customUnitName', e.target.value)} 
                                                                    required 
                                                                />
                                                                <button type="button" className="btn-secondary close-icon-btn" onClick={() => {
                                                                    handleItemChange(index, 'isNewUnit', false);
                                                                    handleItemChange(index, 'customUnitName', '');
                                                                    handleItemChange(index, 'unitMessage', '');
                                                                }}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <select className="grid-input" value={item.selectedUnit} onChange={(e) => {
                                                                if (e.target.value === "ADD_NEW") {
                                                                    handleItemChange(index, 'isNewUnit', true);
                                                                    handleItemChange(index, 'selectedUnit', '');
                                                                } else {
                                                                    handleItemChange(index, 'selectedUnit', e.target.value);
                                                                }
                                                            }} required>
                                                                <option value="" disabled>Select...</option>
                                                                {unitList.map((u, i) => <option key={i} value={u}>{u}</option>)}
                                                                <option disabled>──────</option>
                                                                <option value="ADD_NEW">➕ New Unit</option>
                                                            </select>
                                                        )}
                                                        {item.unitMessage && <span className="error-text block-mt">{item.unitMessage}</span>}
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        <input type="text" inputMode="decimal" className="grid-input num-input" placeholder="0"
                                                            value={item.quantity} onChange={(e) => handleNumberChange(index, 'quantity', e.target.value)} required />
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        <input type="text" inputMode="decimal" className="grid-input num-input" placeholder="0"
                                                            value={item.unitPrice} onChange={(e) => handleNumberChange(index, 'unitPrice', e.target.value)} required />
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        <input type="text" inputMode="decimal" className="grid-input num-input" placeholder="0"
                                                            value={item.sellingPrice} onChange={(e) => handleNumberChange(index, 'sellingPrice', e.target.value)} required />
                                                    </td>
                                                    <td className="grid-td-pad text-bold-slate">
                                                        {item.totalPrice.toLocaleString()}
                                                    </td>
                                                    <td className="grid-td-pad">
                                                        {items.length > 1 && (
                                                            <button type="button" className="btn-remove-grid-item" onClick={() => removeRow(index)} title="Remove row">✕</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button type="button" onClick={addNewRow} className="btn-add-another">
                                    + Add Another Product
                                </button>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="btn-save" onClick={addProduct}>Save Products</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {viewProduct && (
                    <div className="modal-overlay" onClick={closeViewModal}>
                        <div className="modal-content view-modal" onClick={handleModalClick}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="view-modal-title">{viewProduct.productName}</h2>
                                    <span className="view-modal-subtitle">{viewProduct.brandName} • {viewProduct.vendorName} • {viewProduct.category}</span>
                                </div>
                                <button className="close-btn" onClick={closeViewModal}>&times;</button>
                            </div>

                            <div className="view-modal-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Current Stock</span>
                                    <span className="stat-value">{viewProduct.stock} {viewProduct.unit || 'm'}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Cost Price</span>
                                    <span className="stat-value">{Number(viewProduct.unitPrice).toLocaleString()} PKR</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Selling Price</span>
                                    <span className="stat-value">{Number(viewProduct.sellingPrice).toLocaleString()} PKR</span>
                                </div>
                            </div>

                            <h3 className="view-modal-section-title">Sales History</h3>

                            <div className="history-table-container">
                                {productHistory.length > 0 ? (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Receipt #</th>
                                                <th>Qty Sold</th>
                                                <th className="history-total-header">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productHistory.map((record, index) => (
                                                <tr key={index}>
                                                    <td>{new Date(record.sale_date).toLocaleDateString()}</td>
                                                    <td>#{record.receipt_no}</td>
                                                    <td>{record.meters_sold} {viewProduct.unit || 'm'}</td>
                                                    <td className="history-total-cell">
                                                        {Number(record.subtotal).toLocaleString()} PKR
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="history-empty">
                                        No sales recorded for this item yet.
                                    </div>
                                )}
                            </div>

                            <div className="view-modal-footer">
                                <button type="button" className="btn-cancel w-full" onClick={closeViewModal}>Close Record</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}