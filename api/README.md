# Freelance Platform API

This is the backend API for the Freelance Platform, including blockchain-based smart contracts.

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the api directory with the following content:

```
MONGODB=mongodb+srv://your_atlas_username:your_atlas_password@your_cluster.mongodb.net/freelance-platform
PORT=3001
JWT_SECRET=your_jwt_secret_key
ETHEREUM_NODE_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your_private_key_here
ETHEREUM_CHAIN_ID=11155111
```

## Blockchain Integration

This application uses Ethereum smart contracts to manage freelance agreements. To set up blockchain interactions:

1. **Get an Infura API Key**:

   - Register at [Infura](https://infura.io/)
   - Create a new project and get your API key

2. **Set up an Ethereum Wallet**:

   - Use a wallet provider like [MetaMask](https://metamask.io/)
   - Export your private key (CAUTION: Keep your private key safe!)
   - Make sure your wallet has funds on the Sepolia testnet

3. **Get Sepolia Testnet ETH**:

   - Use a faucet like [Sepolia Faucet](https://sepoliafaucet.com/) to get test ETH

4. **Update your .env file**:
   - Replace `YOUR_INFURA_PROJECT_ID` with your actual Infura project ID
   - Replace `your_private_key_here` with your actual private key (without the '0x' prefix)

## How to View Your Contracts on the Blockchain

After creating a contract, you can view its details on the Ethereum blockchain:

1. When a contract is created, you'll see the contract address and transaction hash in the server logs
2. Use [Sepolia Etherscan](https://sepolia.etherscan.io/) to view contract details:
   - Search for your contract address
   - View transactions and contract state

## Contract Lifecycle

The smart contract supports the following lifecycle:

1. **Creation**: When a client places an order, a smart contract is deployed to the blockchain
2. **Activation**: The freelancer accepts the contract, activating it
3. **Completion**: The client marks the contract as complete, releasing funds to the freelancer
4. **Cancellation**: The client can cancel the contract, refunding their payment

## Run the API

```
node server
```

The API will run on port 3001 by default.
