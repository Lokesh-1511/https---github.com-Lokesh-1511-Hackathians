# MetaMask Wallet Integration Setup Guide

## Overview
The AgriChain application now includes MetaMask wallet integration for secure escrow payments using blockchain technology. This allows farmers and buyers to conduct transactions with funds held safely in smart contracts until delivery confirmation.

## Prerequisites

### 1. MetaMask Installation
- Install MetaMask browser extension from [metamask.io](https://metamask.io)
- Create a MetaMask wallet or import an existing one

### 2. Hardhat Local Network Setup
- Make sure Hardhat node is running: `npx hardhat node`
- The EscrowWithOTP smart contract should be deployed (already done)

### 3. Import Test Account to MetaMask
For testing, import one of the Hardhat test accounts:
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Balance**: 10,000 ETH (test tokens)

### 4. Add Hardhat Network to MetaMask
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

## How Wallet Integration Works

### For Farmers:
1. **Login** to your farmer dashboard
2. **Connect Wallet** - Click the "Connect Wallet" button
3. **Address Verification** - MetaMask will connect and verify your registered wallet address
4. **View Escrow Deals** - See all secure payment deals where you're the seller
5. **Complete Deals** - Provide OTP to buyers to release escrowed funds

### For Buyers/Consumers:
1. **Login** to your consumer dashboard  
2. **Connect Wallet** - Click the "Connect Wallet" button
3. **Browse Products** - View available produce from farmers
4. **Secure Payment** - Use "Pay with Escrow" option for secure transactions
5. **Manage Deals** - Track escrow deals and complete payments with OTP

## Escrow Payment Process

### Step 1: Create Escrow Deal (Buyer)
- Buyer initiates secure payment
- Funds are locked in smart contract
- OTP is generated for the transaction
- Farmer receives notification

### Step 2: Delivery & OTP Exchange
- Farmer delivers the produce
- Farmer provides OTP to buyer
- Buyer verifies delivery quality

### Step 3: Complete Transaction
- Buyer enters OTP in dashboard
- Smart contract releases funds to farmer
- Transaction is complete and recorded on blockchain

## Security Features

### Smart Contract Protection
- Funds are held in escrow until OTP verification
- Only buyer can complete the transaction
- Either party can cancel before completion
- All transactions are recorded on blockchain

### Wallet Address Verification  
- System verifies MetaMask address matches registered user
- Prevents unauthorized wallet connections
- Automatic address matching for seamless experience

### OTP Security
- One-time passwords for transaction completion
- Hash-based verification on blockchain
- Prevents unauthorized fund release

## Troubleshooting

### Connection Issues
- Ensure MetaMask is unlocked
- Check you're on the correct network (Hardhat Local)
- Verify wallet address matches your registered address

### Transaction Failures
- Ensure sufficient ETH balance for gas fees
- Check network connection
- Verify contract is deployed and accessible

### OTP Problems
- OTP must be entered exactly as provided
- Case-sensitive verification
- Contact farmer if OTP is lost

## Current System Status

### Deployed Contracts
- **EscrowWithOTP**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network**: Hardhat Local (Chain ID: 31337)
- **Status**: Active and Ready for Testing

### Supported Features
✅ Wallet connection and verification  
✅ Escrow deal creation  
✅ OTP-based transaction completion  
✅ Deal cancellation  
✅ Real-time transaction tracking  
✅ Automatic network switching  

### Test User Accounts
You can test with existing Firebase users and the imported MetaMask account.

## Getting Started

1. **Start Backend**: Ensure backend is running on port 5000
2. **Start Hardhat**: Run `npx hardhat node` 
3. **Start Frontend**: Run `npm run dev` in frontend folder
4. **Setup MetaMask**: Import test account and add Hardhat network
5. **Login**: Use existing farmer/buyer accounts
6. **Connect Wallet**: Click connect button in dashboard
7. **Test Escrow**: Create test transactions between accounts

The system is now ready for secure blockchain-based transactions!
