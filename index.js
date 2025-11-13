const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Contract Configuration
const CONTRACT_ADDRESS = '0x1fd3a9d39f946c55da34a87068c085847a6ff810';
const RPC_URL = 'https://ethereum-sepolia.gateway.tatum.io';

// Load ABI
const abiPath = path.join(__dirname, 'Artifacts', 'abi.json');
const CONTRACT_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// Initialize provider and contract
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// API Test Endpoint - Fetch contract data
app.get('/contractApiTest', async (req, res) => {
    try {
        console.log('\n=== Contract API Test ===');
        console.log('Fetching data from contract...');
        
        // Fetch name from contract
        const name = await contract.getName();
        console.log('Contract Name:', name || '(empty)');
        
        // Fetch balance from contract
        const balance = await contract.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log('Contract Balance:', balanceInEth, 'ETH');
        console.log('Contract Balance (wei):', balance.toString());
        
        // Prepare response
        const data = {
            success: true,
            contractAddress: CONTRACT_ADDRESS,
            network: 'Sepolia Testnet',
            data: {
                name: name || '(empty)',
                balance: {
                    eth: balanceInEth,
                    wei: balance.toString()
                }
            },
            timestamp: new Date().toISOString()
        };
        
    console.log('\nData fetched successfully!');
        console.log('=========================\n');
        
        res.json(data);
        
    } catch (error) {
    console.error('Error fetching contract data:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Name endpoint
app.get('/api/getName', async (req, res) => {
    try {
        const name = await contract.getName();
        console.log('API Call - Get Name:', name || '(empty)');
        
        res.json({
            success: true,
            name: name || '(empty)'
        });
    } catch (error) {
        console.error('Error getting name:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Balance endpoint
app.get('/api/getBalance', async (req, res) => {
    try {
        const balance = await contract.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        
        console.log('API Call - Get Balance:', balanceInEth, 'ETH');
        
        res.json({
            success: true,
            balance: {
                eth: balanceInEth,
                wei: balance.toString()
            }
        });
    } catch (error) {
        console.error('Error getting balance:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all contract info
app.get('/api/contractInfo', async (req, res) => {
    try {
        const [name, balance] = await Promise.all([
            contract.getName(),
            contract.getBalance()
        ]);
        
        const balanceInEth = ethers.utils.formatEther(balance);
        
        console.log('API Call - Contract Info:');
        console.log('  Name:', name || '(empty)');
        console.log('  Balance:', balanceInEth, 'ETH');
        
        res.json({
            success: true,
            contractAddress: CONTRACT_ADDRESS,
            network: 'Sepolia Testnet',
            data: {
                name: name || '(empty)',
                balance: {
                    eth: balanceInEth,
                    wei: balance.toString()
                }
            }
        });
    } catch (error) {
        console.error('Error getting contract info:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is running',
        contractAddress: CONTRACT_ADDRESS,
        network: 'Sepolia Testnet'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\nServer is running!');
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`Network: Sepolia Testnet`);
    console.log('\nAvailable Endpoints:');
    console.log(`   GET  /contractApiTest    - Main test endpoint (logs to console)`);
    console.log(`   GET  /api/getName        - Get contract name`);
    console.log(`   GET  /api/getBalance     - Get contract balance`);
    console.log(`   GET  /api/contractInfo   - Get all contract info`);
    console.log(`   GET  /health             - Health check`);
    console.log('\nTry: curl http://localhost:3000/contractApiTest\n');
});
