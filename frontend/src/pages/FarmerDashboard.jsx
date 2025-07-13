import React, { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';

const FarmerDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleWalletConnected = (account, updatedUser) => {
    console.log('Wallet connected in dashboard:', account);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const handleWalletDisconnected = () => {
    console.log('Wallet disconnected in dashboard');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <h2>Farmer Dashboard</h2>
        <WalletConnection 
          currentUser={currentUser}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
        />
      </div>
      <div className="dashboard-content">
        <p>Welcome, {currentUser.name}!</p>
        {/* Add more dashboard content here */}
      </div>
    </div>
  );
};

export default FarmerDashboard;