// Web3 Manager Module - Fixed Version
export class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAccount = null;
        this.auctionContract = null;
        this.erc404Contract = null;
        
        // Initialize contractAddresses first
        this.contractAddresses = {
            auction: "0x2c13b85c1290af3949c48321cbe7bd26c3b659c6",
            nft: "0x70e14fa0dda8c403da2590283b5201f4b03e42a8"
        };
        
        // Then check demo mode
        this.isDemo = this.checkDemoMode();
        
        this.networkConfig = {
            chainId: 11155111n, // Sepolia testnet
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
        };
    }

    checkDemoMode() {
        return !window.ethereum || 
               !this.contractAddresses?.auction?.startsWith('0x') || 
               this.contractAddresses.auction === "0x1234567890123456789012345678901234567890";
    }

    async init() {
        try {
            if (!window.ethereum) {
                console.log('MetaMask not detected - running in demo mode');
                return;
            }

            // Wait for ethers to be available
            await this.waitForEthers();

            this.provider = new ethers.BrowserProvider(window.ethereum);
            
            // Check if already connected
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) {
                this.userAccount = accounts[0].address;
                this.signer = await this.provider.getSigner();
                await this.updateWalletUI();
                await this.checkNetwork();
                await this.initializeContracts();
            }
            
            // Listen for account and network changes
            this.setupEventListeners();
            
            if (this.isDemo) {
                this.showDemoNotification();
            }
            
        } catch (error) {
            console.error('Error initializing Web3:', error);
        }
    }

    async waitForEthers() {
        return new Promise((resolve) => {
            if (window.ethers) {
                resolve();
                return;
            }
            
            const checkEthers = () => {
                if (window.ethers) {
                    resolve();
                } else {
                    setTimeout(checkEthers, 100);
                }
            };
            
            checkEthers();
        });
    }

    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }

    async connectWallet() {
        if (!window.ethereum) {
            this.showInstallMetaMaskPrompt();
            return false;
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAccount = accounts[0];
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // Check and switch network if needed
            await this.checkNetwork();
            
            // Initialize contracts
            await this.initializeContracts();
            
            // Update UI
            await this.updateWalletUI();
            
            this.showToast('Wallet connected successfully!', 'success');
            return true;
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.handleConnectionError(error);
            return false;
        }
    }

    async checkNetwork() {
        if (!this.provider || this.isDemo) return;
        
        try {
            const network = await this.provider.getNetwork();
            
            if (network.chainId !== this.networkConfig.chainId) {
                await this.switchNetwork();
            }
        } catch (error) {
            console.error('Network check failed:', error);
        }
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + this.networkConfig.chainId.toString(16) }],
            });
        } catch (error) {
            if (error.code === 4902) {
                // Chain not added, add it
                await this.addNetwork();
            } else {
                this.showToast('Failed to switch network', 'error');
            }
        }
    }

    async addNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x' + this.networkConfig.chainId.toString(16),
                    chainName: this.networkConfig.chainName,
                    nativeCurrency: this.networkConfig.nativeCurrency,
                    rpcUrls: this.networkConfig.rpcUrls,
                    blockExplorerUrls: this.networkConfig.blockExplorerUrls
                }]
            });
        } catch (error) {
            this.showToast('Failed to add network', 'error');
        }
    }

    async initializeContracts() {
        if (this.isDemo || !this.signer) return;

        try {
            // Initialize contracts when ABIs are available
            // This would typically load from external ABI files
            const auctionABI = await this.loadABI('auction');
            const erc404ABI = await this.loadABI('erc404');

            this.auctionContract = new ethers.Contract(
                this.contractAddresses.auction,
                auctionABI,
                this.signer
            );

            this.erc404Contract = new ethers.Contract(
                this.contractAddresses.erc404,
                erc404ABI,
                this.signer
            );

            console.log('Contracts initialized');
        } catch (error) {
            console.log('Contracts pending deployment or ABI not available');
        }
    }

    async loadABI(contractName) {
        try {
            const response = await fetch(`/assets/abi/${contractName}.json`);
            return await response.json();
        } catch (error) {
            console.log(`ABI for ${contractName} not found`);
            return this.getFallbackABI(contractName);
        }
    }

    getFallbackABI(contractName) {
        // Fallback ABIs for demo purposes
        const abis = {
            auction: [
                {
                    "inputs": [{"name": "artifactId", "type": "uint256"}],
                    "name": "placeBid",
                    "outputs": [{"name": "", "type": "bool"}],
                    "payable": true,
                    "type": "function"
                }
            ],
            erc404: [
                {
                    "inputs": [],
                    "name": "name",
                    "outputs": [{"name": "", "type": "string"}],
                    "type": "function"
                },
                {
                    "inputs": [{"name": "owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "type": "function"
                }
            ]
        };
        return abis[contractName] || [];
    }

    async placeBid(artifactId, bidAmount) {
        if (this.isDemo) {
            return this.simulateBid(bidAmount);
        }

        if (!this.auctionContract) {
            throw new Error('Auction contract not initialized');
        }

        try {
            const tx = await this.auctionContract.placeBid(artifactId, {
                value: ethers.parseUnits(bidAmount.toString(), 6) // USDT has 6 decimals
            });
            
            const receipt = await tx.wait();
            
            this.showToast(`Bid placed! Transaction: ${receipt.hash.slice(0, 10)}...`, 'success');
            return true;
            
        } catch (error) {
            console.error('Bid placement failed:', error);
            throw error;
        }
    }

    async simulateBid(bidAmount) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate random success/failure for demo
        if (Math.random() > 0.1) { // 90% success rate
            return true;
        } else {
            throw new Error('Demo: Simulated transaction failure');
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.userAccount = null;
            this.signer = null;
            this.updateWalletUI();
            this.showToast('Wallet disconnected', 'error');
        } else if (accounts[0] !== this.userAccount) {
            this.userAccount = accounts[0];
            this.updateWalletUI();
            this.showToast('Account changed', 'success');
        }
    }

    handleConnectionError(error) {
        switch (error.code) {
            case 4001:
                this.showToast('Connection cancelled', 'error');
                break;
            case -32002:
                this.showToast('Please unlock MetaMask', 'error');
                break;
            default:
                this.showToast('Failed to connect wallet', 'error');
        }
    }

    async updateWalletUI() {
        const walletButton = document.querySelector('.connect-wallet');
        const walletText = document.getElementById('wallet-text');
        
        if (!walletButton || !walletText) return;

        if (this.userAccount) {
            walletButton.classList.add('connected');
            walletText.textContent = `${this.userAccount.slice(0, 6)}...${this.userAccount.slice(-4)}`;
        } else {
            walletButton.classList.remove('connected');
            walletText.textContent = 'Connect Wallet';
        }
    }

    isConnected() {
        return !!this.userAccount;
    }

    showInstallMetaMaskPrompt() {
        const install = confirm('MetaMask is required to use this dApp. Would you like to install it?');
        if (install) {
            window.open('https://metamask.io/download/', '_blank');
        }
    }

    showDemoNotification() {
        setTimeout(() => {
            this.showToast('Running in Demo Mode - Connect wallet and deploy contracts for real transactions', 'info');
        }, 2000);
    }

    showToast(message, type = 'info') {
        // Use the UI manager if available, otherwise fall back to simple implementation
        if (window.app?.uiManager) {
            window.app.uiManager.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Cleanup method
    destroy() {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
        }
    }

    // Utility methods
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatBalance(balance, decimals = 18) {
        if (!balance) return '0';
        return ethers.formatUnits(balance, decimals);
    }

    parseBalance(amount, decimals = 18) {
        return ethers.parseUnits(amount.toString(), decimals);
    }

    // Get network information
    async getNetworkInfo() {
        if (!this.provider) return null;
        
        try {
            const network = await this.provider.getNetwork();
            return {
                chainId: network.chainId,
                name: network.name
            };
        } catch (error) {
            console.error('Failed to get network info:', error);
            return null;
        }
    }

    // Get gas price
    async getGasPrice() {
        if (!this.provider) return null;
        
        try {
            const gasPrice = await this.provider.getFeeData();
            return gasPrice;
        } catch (error) {
            console.error('Failed to get gas price:', error);
            return null;
        }
    }
}
