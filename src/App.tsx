/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';
import { InventoryView } from './components/InventoryView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Login } from './components/Auth/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141414]"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout user={user} />}>
          <Route path="/" element={<InventoryView />} />
          <Route 
            path="/admin" 
            element={user ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/login" element={<Login user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}
