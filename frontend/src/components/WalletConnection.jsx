import React, { useState, useEffect } from 'react'
import walletService from '../services/walletService'
import userService from '../services/userService'
import styles from './WalletConnection.module.css'

const WalletConnection = ({ currentUser, onWalletConnected, onWalletDisconnected }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [isCorrectAddress, setIsCorrectAddress] = useState(false)
  const [error, setError] = useState('')
  const [walletBalance, setWalletBalance] = useState('')

  useEffect(() => {
    checkExistingConnection()
    
    // Listen for wallet account changes
    const handleAccountChange = (event) => {
      const { account } = event.detail
      setConnectedAccount(account)
      checkAddressMatch(account)
    }

    window.addEventListener('walletAccountChanged', handleAccountChange)

    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountChange)
    }
  }, [currentUser])

  const checkExistingConnection = async () => {
    try {
      const account = await walletService.getCurrentAccount()
      if (account) {
        setConnectedAccount(account)
        await checkAddressMatch(account)
        await getBalance()
      }
    } catch (error) {
      console.error('Error checking existing connection:', error)
    }
  }

  const checkAddressMatch = async (account) => {
    if (!currentUser || !currentUser.walletAddress) {
      setIsCorrectAddress(false)
      return false
    }

    const isMatch = account.toLowerCase() === currentUser.walletAddress.toLowerCase()
    setIsCorrectAddress(isMatch)
    
    if (isMatch && onWalletConnected) {
      onWalletConnected(account)
    } else if (!isMatch && onWalletDisconnected) {
      onWalletDisconnected()
    }
    
    return isMatch
  }

  const getBalance = async () => {
    try {
      const balance = await walletService.getBalance()
      setWalletBalance(parseFloat(balance).toFixed(4))
    } catch (error) {
      console.error('Error getting balance:', error)
      setWalletBalance('')
    }
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!walletService.isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install it to continue.');
        setIsConnecting(false);
        return;
      }

      await walletService.switchToLocalNetwork();
      const { account } = await walletService.connectWallet();
      setConnectedAccount(account);

      // If user has no wallet address, update it now
      if (currentUser && !currentUser.walletAddress) {
        const updatedUser = await userService.updateUserWallet(account);
        if (updatedUser) {
          onWalletConnected(account, updatedUser); // Pass updated user info up
          setIsCorrectAddress(true);
        } else {
          setError('Failed to save your new wallet address. Please try again.');
          return;
        }
      } else {
        // Otherwise, just check the address match
        const isMatch = await checkAddressMatch(account);
        if (!isMatch) {
          setError(`Connected wallet (${formatAddress(account)}) doesn't match your registered address (${formatAddress(currentUser.walletAddress)}). Please switch accounts in MetaMask.`);
          return;
        }
      }

      await getBalance();
      setError('');

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    walletService.disconnect()
    setConnectedAccount(null)
    setIsCorrectAddress(false)
    setWalletBalance('')
    setError('')
    
    if (onWalletDisconnected) {
      onWalletDisconnected()
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className={styles.walletConnection}>
      <div className={styles.walletStatus}>
        {!connectedAccount ? (
          <div className={styles.walletDisconnected}>
            <button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className={styles.connectWalletBtn}
            >
              {isConnecting ? 'Connecting...' : (currentUser?.walletAddress ? 'Connect Wallet' : 'Connect & Save Wallet')}
            </button>
            
            {currentUser?.walletAddress && (
              <p className={styles.registeredAddress}>
                Registered Address: {formatAddress(currentUser.walletAddress)}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.walletConnected}>
            <div className={styles.walletInfo}>
              <div className={styles.accountInfo}>
                <span className={styles.accountLabel}>Connected:</span>
                <span className={styles.accountAddress}>{formatAddress(connectedAccount)}</span>
                {walletBalance && (
                  <span className={styles.accountBalance}>{walletBalance} ETH</span>
                )}
              </div>
              
              <div className={styles.connectionStatus}>
                {isCorrectAddress ? (
                  <span className={styles.statusCorrect}>✅ Correct Address</span>
                ) : (
                  <span className={styles.statusIncorrect}>❌ Wrong Address</span>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleDisconnectWallet}
              className={styles.disconnectWalletBtn}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.walletError}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {!currentUser?.walletAddress && !connectedAccount && (
        <div className={styles.noWalletWarning}>
          <p>You have no wallet address registered. Connect a wallet to automatically save it to your profile.</p>
        </div>
      )}
    </div>
  )
}

export default WalletConnection
