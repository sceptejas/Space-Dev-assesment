// Contract Configuration
const CONTRACT_ADDRESS = '0x1fd3a9d39f946c55da34a87068c085847a6ff810';
const CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const RPC_URL = 'https://ethereum-sepolia.gateway.tatum.io';

// Contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "balance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getName",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stake",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_name", "type": "string"}],
        "name": "updateName",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let provider;
let signer;
let contract;
let userAddress;

// Initialize on page load
window.addEventListener('load', () => {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
});

// Connect Wallet Function
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showStatus('Please install MetaMask to use this dApp!', 'error');
            return;
        }

        showStatus('Connecting wallet...', 'info');

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        userAddress = accounts[0];

        // Check if on correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CHAIN_ID }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    showStatus('Please add Sepolia testnet to MetaMask', 'error');
                    return;
                }
                throw switchError;
            }
        }

        // Initialize provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Update UI
        document.getElementById('connectWallet').style.display = 'none';
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = 
            `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        document.getElementById('contractSection').classList.remove('hidden');

        showStatus('Wallet connected successfully!', 'success');

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

    } catch (error) {
        console.error('Error connecting wallet:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        showStatus('Please connect to MetaMask', 'error');
        window.location.reload();
    } else {
        userAddress = accounts[0];
        document.getElementById('walletAddress').textContent = 
            `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    }
}

// Read Functions
async function getName() {
    try {
        showStatus('Fetching name...', 'info');
        const name = await contract.getName();
        document.getElementById('nameOutput').textContent = name || '(empty)';
        showStatus('Name fetched successfully!', 'success');
    } catch (error) {
        console.error('Error getting name:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

async function getBalance() {
    try {
        showStatus('Fetching balance...', 'info');
        const balance = await contract.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        document.getElementById('balanceOutput').textContent = 
            `${balanceInEth} ETH (${balance.toString()} wei)`;
        showStatus('Balance fetched successfully!', 'success');
    } catch (error) {
        console.error('Error getting balance:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Write Functions
async function updateName() {
    try {
        const newName = document.getElementById('nameInput').value;
        
        if (!newName) {
            showStatus('Please enter a name', 'error');
            return;
        }

        showStatus('Updating name... Please confirm transaction', 'info');
        
        const tx = await contract.updateName(newName);
        showStatus('Transaction submitted. Waiting for confirmation...', 'info');
        
        await tx.wait();
        showStatus('Name updated successfully!', 'success');
        
        document.getElementById('nameInput').value = '';
        
        // Auto-refresh the name
        setTimeout(getName, 1000);
        
    } catch (error) {
        console.error('Error updating name:', error);
        if (error.code === 4001) {
            showStatus('Transaction rejected by user', 'error');
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
}

async function stake() {
    try {
        const amount = document.getElementById('stakeAmount').value;
        
        if (!amount || amount <= 0) {
            showStatus('Please enter a valid amount', 'error');
            return;
        }

        showStatus('Staking ETH... Please confirm transaction', 'info');
        
        const tx = await contract.stake({
            value: ethers.utils.parseEther(amount)
        });
        
        showStatus('Transaction submitted. Waiting for confirmation...', 'info');
        
        await tx.wait();
        showStatus(`Successfully staked ${amount} ETH!`, 'success');
        
        document.getElementById('stakeAmount').value = '';
        
        // Auto-refresh the balance
        setTimeout(getBalance, 1000);
        
    } catch (error) {
        console.error('Error staking:', error);
        if (error.code === 4001) {
            showStatus('Transaction rejected by user', 'error');
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
}

async function withdraw() {
    try {
        showStatus('Withdrawing... Please confirm transaction', 'info');
        
        const tx = await contract.withdraw();
        showStatus('Transaction submitted. Waiting for confirmation...', 'info');
        
        await tx.wait();
        showStatus('Withdrawal successful!', 'success');
        
        // Auto-refresh the balance
        setTimeout(getBalance, 1000);
        
    } catch (error) {
        console.error('Error withdrawing:', error);
        if (error.code === 4001) {
            showStatus('Transaction rejected by user', 'error');
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
    }
}

// Utility function to show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 5000);
    }
}
