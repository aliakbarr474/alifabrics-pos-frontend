import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/pos', label: 'Sales (POS)' },
        { path: '/inventory', label: 'Inventory' },
        { path: '/vendors', label: 'Vendors' },
        { path: '/accounts', label: 'Accounts' },
        { path: '/customers', label: 'Customers' },
        { path: '/invoices', label: 'Invoices' },
        { path: '/settings', label: 'Settings' },
    ];

    return (
        <aside className="main-sidebar">
            <div className="sidebar-brand">
                <h2>Ali Fabrics</h2>
            </div>
            
            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink 
                                to={item.path}
                                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}