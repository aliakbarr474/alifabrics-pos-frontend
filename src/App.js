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

        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><Pos /></ProtectedRoute>} />
        <Route path='/vendors' element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
        <Route path='/accounts' element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path='/customers' element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path='/invoices' element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;