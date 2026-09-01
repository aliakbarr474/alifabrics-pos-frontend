import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import ProtectedRoute from './ProtectedRoute';
import Inventory from './Inventory';
import Pos from './Pos';
import Vendors from './Vendors';
import Accounts from './Accounts';
import Customers from './Customers';
import Settings from './Settings';
import Invoices from './Invoices';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="/products" element={<Inventory />} />
        <Route path="/pos" element={<Pos />} />
        <Route path='/vendors' element={<Vendors />} />
        <Route path='/accounts' element={<Accounts />} />
        <Route path='/customers' element={<Customers />} />
        <Route path='/invoices' element={<Invoices />} />
        <Route path='/settings' element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;