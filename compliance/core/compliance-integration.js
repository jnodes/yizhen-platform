// compliance-integration.js - Integration layer for Yizhen Platform
// Connects compliance AI agents with existing Web3 functionality

import { ComplianceAIAgent, RiskMonitoringAgent } from './compliance-ai-agent.js';
import { Web3Manager } from './assets/js/web3.js';

class ComplianceIntegration {
    constructor() {
        this.complianceAgent = null;
        this.riskMonitor = null;
        this.web3Manager = null;
        this.isInitialized = false;
        this.complianceHooks = new Map();
        this.pendingTransactions = new Map();
        
        // Configuration
        this.config = {
            enableCompliance: true,
            autoKYC: true,
            blockHighRisk: true,
            requireKYCForBids: true,
            maxBidWithoutKYC: 10000, // USD
            complianceMode: 'strict', // 'strict', 'moderate', 'light'
            realTimeMonitoring: true,
            ragConfig: {
                endpoint: process.env.RAG_ENDPOINT || 'https://rag.yizhen-compliance.com',
                apiKey: process.env.RAG_API_KEY
            }
        };
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Compliance Integration...');
            
            // Initialize compliance agent
            this.complianceAgent = new ComplianceAIAgent({
                ...this.config.ragConfig,
                demoMode: this.isDemoMode(),
                riskThreshold: this.getRiskThreshold()
            });
            
            // Initialize risk monitor
            this.riskMonitor = new RiskMonitoringAgent(this.complianceAgent);
            
            // Wait for Web3Manager to be available
            await this.waitForWeb3();
            
            // Hook into Web3Manager
            this.hookIntoWeb3();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Compliance Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Compliance Integration:', error);
        }
    }

    async waitForWeb3() {
        return new Promise((resolve) => {
            const checkWeb3 = () => {
                if (window.app?.web3Manager) {
                    this.web3Manager = window.app.web3Manager;
                    resolve();
                } else {
                    setTimeout(checkWeb3, 100);
                }
            };
            checkWeb3();
        });
    }

    hookIntoWeb3() {
        // Override Web3Manager methods to add compliance checks
        this.overrideConnectWallet();
        this.overridePlaceBid();
        this.overrideTransaction();
    }

    overrideConnectWallet() {
        const originalConnect = this.web3Manager.connectWallet.bind(this.web3Manager);
        
        this.web3Manager.connectWallet = async () => {
            try {
                // First connect the wallet
                const connected = await originalConnect();
                
                if (!connected) return false;
                
                // Then run compliance checks
                const walletAddress = this.web3Manager.userAccount;
                const complianceResult = await this.checkWalletCompliance(walletAddress);
                
                if (complianceResult.overallStatus === 'blocked') {
                    // Disconnect wallet if blocked
                    await this.handleBlockedWallet(walletAddress, complianceResult);
                    return false;
                }
                
                if (complianceResult.overallStatus === 'pending-verification') {
                    // Show KYC modal
                    await this.showKYCModal(walletAddress, complianceResult);
                }
                
                // Start monitoring if enabled
                if (this.config.realTimeMonitoring) {
                    this.riskMonitor.startMonitoring(walletAddress);
                }
                
                // Update UI with compliance status
                this.updateComplianceUI(complianceResult);
                
                return true;
                
            } catch (error) {
                console.error('Compliance check during wallet connection failed:', error);
                this.showComplianceError(error);
                return false;
            }
        };
    }

    overridePlaceBid() {
        const originalPlaceBid = this.web3Manager.placeBid.bind(this.web3Manager);
        
        this.web3Manager.placeBid = async (artifactId, bidAmount) => {
            try {
                const walletAddress = this.web3Manager.userAccount;
                
                if (!walletAddress) {
                    throw new Error('Wallet not connected');
                }
                
                // Pre-transaction compliance check
                const complianceCheck = await this.preTransactionCheck(walletAddress, {
                    type: 'bid',
                    artifactId,
                    amount: bidAmount,
                    timestamp: Date.now()
                });
                
                if (!complianceCheck.approved) {
                    await this.handleRejectedTransaction(complianceCheck);
                    return false;
                }
                
                // If KYC required for amount
                if (bidAmount > this.config.maxBidWithoutKYC && 
                    complianceCheck.kyc?.status !== 'verified') {
                    await this.requestKYC(walletAddress, 'bid-amount-exceeded');
                    return false;
                }
                
                // Store pending transaction for monitoring
                const txId = this.generateTransactionId();
                this.pendingTransactions.set(txId, {
                    walletAddress,
                    type: 'bid',
                    artifactId,
                    amount: bidAmount,
                    status: 'pending',
                    complianceCheck,
                    timestamp: Date.now()
                });
                
                // Execute original bid
                const result = await originalPlaceBid(artifactId, bidAmount);
                
                // Post-transaction compliance
                await this.postTransactionCompliance(txId, result);
                
                return result;
                
            } catch (error) {
                console.error('Compliance-enhanced bid failed:', error);
                throw error;
            }
        };
    }

    overrideTransaction() {
        // Hook into all Web3 transactions
        if (this.web3Manager.provider) {
            const originalSend = this.web3Manager.provider.send;
            
            this.web3Manager.provider.send = async (method, params) => {
                // Intercept transaction methods
                if (method === 'eth_sendTransaction' || method === 'eth_sendRawTransaction') {
                    const txData = params[0];
                    const complianceCheck = await this.preTransactionCheck(
                        txData.from || this.web3Manager.userAccount,
                        txData
                    );
                    
                    if (!complianceCheck.approved) {
                        throw new Error('Transaction blocked by compliance check');
                    }
                }
                
                return originalSend.call(this.web3Manager.provider, method, params);
            };
        }
    }

    async checkWalletCompliance(walletAddress) {
        console.log(`🔍 Running compliance check for wallet: ${walletAddress}`);
        
        // Show loading indicator
        this.showComplianceLoading();
        
        try {
            const complianceResult = await this.complianceAgent.checkCompliance(walletAddress);
            
            // Store result
            this.complianceHooks.set(walletAddress, {
                result: complianceResult,
                timestamp: Date.now()
            });
            
            return complianceResult;
            
        } finally {
            this.hideComplianceLoading();
        }
    }

    async preTransactionCheck(walletAddress, transactionData) {
        // Quick check if we have recent compliance data
        const cached = this.complianceHooks.get(walletAddress);
        
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
            // Use cached result for quick decision
            return {
                approved: cached.result.overallStatus !== 'blocked',
                ...cached.result
            };
        }
        
        // Full compliance check with transaction context
        const complianceResult = await this.complianceAgent.checkCompliance(
            walletAddress,
            transactionData
        );
        
        return {
            approved: this.isTransactionApproved(complianceResult),
            ...complianceResult
        };
    }

    isTransactionApproved(complianceResult) {
        const blockedStatuses = ['blocked', 'high-risk', 'manual-review'];
        
        if (this.config.complianceMode === 'strict') {
            return !blockedStatuses.includes(complianceResult.overallStatus);
        } else if (this.config.complianceMode === 'moderate') {
            return complianceResult.overallStatus !== 'blocked';
        } else {
            // Light mode - only block sanctioned addresses
            return complianceResult.sanctions?.status !== 'blocked';
        }
    }

    async postTransactionCompliance(txId, result) {
        const pendingTx = this.pendingTransactions.get(txId);
        if (!pendingTx) return;
        
        // Update transaction status
        pendingTx.status = result ? 'completed' : 'failed';
        pendingTx.result = result;
        
        // Log for compliance reporting
        await this.logComplianceEvent({
            type: 'transaction',
            txId,
            walletAddress: pendingTx.walletAddress,
            transactionType: pendingTx.type,
            amount: pendingTx.amount,
            complianceStatus: pendingTx.complianceCheck.overallStatus,
            timestamp: Date.now()
        });
        
        // Clean up after 1 hour
        setTimeout(() => {
            this.pendingTransactions.delete(txId);
        }, 3600000);
    }

    async handleBlockedWallet(walletAddress, complianceResult) {
        console.log(`🚫 Wallet ${walletAddress} blocked by compliance`);
        
        // Show detailed blocking reason
        const blockingReasons = this.getBlockingReasons(complianceResult);
        
        this.showModal({
            title: 'Access Restricted',
            content: `
                <div class="compliance-blocked">
                    <h3>Your wallet has been restricted from accessing the platform</h3>
                    <div class="blocking-reasons">
                        ${blockingReasons.map(reason => `
                            <div class="reason">
                                <span class="icon">${reason.icon}</span>
                                <span class="text">${reason.text}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="help-text">
                        If you believe this is an error, please contact our compliance team.
                    </p>
                </div>
            `,
            buttons: [{
                text: 'Contact Support',
                action: () => this.openSupportChat('compliance-blocked')
            }, {
                text: 'Close',
                action: () => this.closeModal()
            }]
        });
        
        // Disconnect the wallet
        if (this.web3Manager.provider) {
            await this.web3Manager.provider.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            }).catch(() => {});
        }
    }

    getBlockingReasons(complianceResult) {
        const reasons = [];
        
        if (complianceResult.sanctions?.status === 'blocked') {
            reasons.push({
                icon: '🚫',
                text: 'Wallet address found on sanctions list'
            });
        }
        
        if (complianceResult.jurisdiction?.status === 'restricted') {
            reasons.push({
                icon: '🌍',
                text: `Access restricted from ${complianceResult.jurisdiction.jurisdiction.name}`
            });
        }
        
        if (complianceResult.aml?.status === 'high-risk') {
            reasons.push({
                icon: '⚠️',
                text: 'High-risk activity detected'
            });
        }
        
        return reasons;
    }

    async showKYCModal(walletAddress, complianceResult) {
        const kycData = complianceResult.kyc;
        
        this.showModal({
            title: 'Verification Required',
            content: `
                <div class="kyc-modal">
                    <h3>Complete your identity verification to continue</h3>
                    <p>To comply with regulations and ensure a secure trading environment, 
                       we need to verify your identity.</p>
                    
                    <div class="kyc-requirements">
                        <h4>Required Documents:</h4>
                        ${kycData.requiredDocuments.map(doc => `
                            <div class="document-requirement">
                                <input type="checkbox" id="${doc.type}" disabled>
                                <label for="${doc.type}">${this.getDocumentLabel(doc.type)}</label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="kyc-benefits">
                        <h4>Benefits of Verification:</h4>
                        <ul>
                            <li>Higher transaction limits</li>
                            <li>Access to exclusive auctions</li>
                            <li>Priority customer support</li>
                        </ul>
                    </div>
                </div>
            `,
            buttons: [{
                text: 'Start Verification',
                primary: true,
                action: () => this.startKYCProcess(walletAddress)
            }, {
                text: 'Later',
                action: () => this.closeModal()
            }]
        });
    }

    async startKYCProcess(walletAddress) {
        console.log(`📋 Starting KYC process for ${walletAddress}`);
        
        try {
            // In production, this would redirect to KYC provider
            if (this.complianceAgent.config.demoMode) {
                // Simulate KYC completion in demo mode
                setTimeout(async () => {
                    const result = await this.complianceAgent.performKYC(walletAddress);
                    if (result.status === 'verified') {
                        this.showToast('Verification complete! You now have full access.', 'success');
                        this.updateComplianceUI(result);
                    }
                }, 3000);
                
                this.showToast('Demo Mode: KYC will complete automatically', 'info');
            } else {
                // Real KYC integration
                window.location.href = `${this.config.kycProvider.url}?wallet=${walletAddress}&return=${window.location.href}`;
            }
        } catch (error) {
            console.error('KYC process failed:', error);
            this.showToast('Verification process failed. Please try again.', 'error');
        }
    }

    async requestKYC(walletAddress, reason) {
        this.showModal({
            title: 'Verification Required',
            content: `
                <div class="kyc-required">
                    <h3>Identity verification is required for this transaction</h3>
                    <p>${this.getKYCReasonText(reason)}</p>
                    <div class="kyc-info">
                        <p>The verification process typically takes 5-10 minutes.</p>
                        <p>You'll need a government-issued ID and proof of address.</p>
                    </div>
                </div>
            `,
            buttons: [{
                text: 'Verify Now',
                primary: true,
                action: () => this.startKYCProcess(walletAddress)
            }, {
                text: 'Cancel',
                action: () => this.closeModal()
            }]
        });
    }

    getKYCReasonText(reason) {
        const reasons = {
            'bid-amount-exceeded': `Bids over ${this.formatCurrency(this.config.maxBidWithoutKYC)} require identity verification.`,
            'high-value-transaction': 'This high-value transaction requires identity verification.',
            'regulatory-requirement': 'Your jurisdiction requires identity verification for this service.',
            'risk-based': 'Based on our risk assessment, identity verification is required.'
        };
        
        return reasons[reason] || 'Identity verification is required to proceed.';
    }

    updateComplianceUI(complianceResult) {
        // Add compliance status indicator to UI
        const walletButton = document.querySelector('.connect-wallet');
        if (!walletButton) return;
        
        // Remove existing indicators
        const existingIndicator = walletButton.querySelector('.compliance-indicator');
        if (existingIndicator) existingIndicator.remove();
        
        // Add new indicator
        const indicator = document.createElement('span');
        indicator.className = 'compliance-indicator';
        
        const statusConfig = this.getStatusConfig(complianceResult.overallStatus);
        indicator.innerHTML = statusConfig.icon;
        indicator.setAttribute('title', statusConfig.tooltip);
        indicator.style.cssText = `
            margin-left: 8px;
            font-size: 14px;
            cursor: help;
        `;
        
        walletButton.appendChild(indicator);
        
        // Update any compliance-specific UI elements
        this.updateComplianceWidgets(complianceResult);
    }

    getStatusConfig(status) {
        const configs = {
            'approved': {
                icon: '✅',
                tooltip: 'Fully verified'
            },
            'conditional-approval': {
                icon: '⚠️',
                tooltip: 'Limited access - verification recommended'
            },
            'pending-verification': {
                icon: '⏳',
                tooltip: 'Verification pending'
            },
            'manual-review': {
                icon: '🔍',
                tooltip: 'Under review'
            },
            'blocked': {
                icon: '🚫',
                tooltip: 'Access restricted'
            }
        };
        
        return configs[status] || { icon: '❓', tooltip: 'Unknown status' };
    }

    updateComplianceWidgets(complianceResult) {
        // Update risk score widget if exists
        const riskWidget = document.getElementById('compliance-risk-score');
        if (riskWidget) {
            const score = Math.round(complianceResult.riskScore.score * 100);
            riskWidget.innerHTML = `
                <div class="risk-score-display">
                    <span class="label">Risk Score:</span>
                    <span class="score ${complianceResult.riskScore.category}">${score}%</span>
                </div>
            `;
        }
        
        // Update KYC status widget
        const kycWidget = document.getElementById('kyc-status');
        if (kycWidget) {
            kycWidget.innerHTML = `
                <div class="kyc-status-display">
                    <span class="label">KYC:</span>
                    <span class="status ${complianceResult.kyc.status}">${complianceResult.kyc.status}</span>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length > 0) {
                    // Stop monitoring old address
                    if (this.web3Manager.userAccount) {
                        this.riskMonitor.stopMonitoring(this.web3Manager.userAccount);
                    }
                    
                    // Check compliance for new address
                    await this.checkWalletCompliance(accounts[0]);
                }
            });
        }
        
        // Listen for compliance update events
        window.addEventListener('compliance-update-required', async (event) => {
            const { walletAddress } = event.detail;
            await this.checkWalletCompliance(walletAddress);
        });
    }

    // UI Helper Methods
    showModal(config) {
        // Implementation would integrate with existing modal system
        const modal = document.createElement('div');
        modal.className = 'compliance-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <h2>${config.title}</h2>
                <div class="modal-body">${config.content}</div>
                <div class="modal-buttons">
                    ${config.buttons.map(btn => `
                        <button class="${btn.primary ? 'primary' : ''}">${btn.text}</button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners to buttons
        const buttons = modal.querySelectorAll('button');
        config.buttons.forEach((btnConfig, index) => {
            buttons[index].addEventListener('click', btnConfig.action);
        });
        
        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.querySelector('.compliance-modal');
        if (modal) modal.remove();
    }

    showToast(message, type = 'info') {
        if (window.app?.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showComplianceLoading() {
        const loader = document.createElement('div');
        loader.id = 'compliance-loader';
        loader.className = 'compliance-loading';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>Verifying compliance status...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideComplianceLoading() {
        const loader = document.getElementById('compliance-loader');
        if (loader) loader.remove();
    }

    showComplianceError(error) {
        this.showToast(`Compliance check failed: ${error.message}`, 'error');
    }

    // Utility Methods
    generateTransactionId() {
        return `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    getDocumentLabel(type) {
        const labels = {
            'government-id': 'Government-issued ID (passport, driver\'s license)',
            'proof-of-address': 'Proof of address (utility bill, bank statement)',
            'source-of-funds': 'Source of funds documentation'
        };
        return labels[type] || type;
    }

    isDemoMode() {
        return this.web3Manager?.isDemo || !window.ethereum;
    }

    getRiskThreshold() {
        const thresholds = {
            strict: 0.3,
            moderate: 0.5,
            light: 0.7
        };
        return thresholds[this.config.complianceMode] || 0.5;
    }

    async logComplianceEvent(event) {
        try {
            // In production, send to compliance logging service
            if (!this.isDemoMode()) {
                await fetch(`${this.config.ragConfig.endpoint}/compliance/log`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.ragConfig.apiKey}`
                    },
                    body: JSON.stringify(event)
                });
            }
            
            console.log('📝 Compliance event logged:', event);
            
        } catch (error) {
            console.error('Failed to log compliance event:', error);
        }
    }

    openSupportChat(reason) {
        // In production, open support chat with context
        console.log(`Opening support chat for reason: ${reason}`);
        window.open(`https://support.yizhen.com/chat?reason=${reason}`, '_blank');
    }

    // Public Methods for External Integration
    async getComplianceStatus(walletAddress) {
        const cached = this.complianceHooks.get(walletAddress);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.result;
        }
        
        return await this.checkWalletCompliance(walletAddress);
    }

    async getMonitoringReport(walletAddress) {
        return this.riskMonitor.getMonitoringReport(walletAddress);
    }

    async updateComplianceConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reinitialize agents with new config
        await this.initialize();
    }

    // Cleanup
    destroy() {
        // Stop all monitoring
        for (const [walletAddress] of this.complianceHooks) {
            this.riskMonitor.stopMonitoring(walletAddress);
        }
        
        // Clear caches
        this.complianceHooks.clear();
        this.pendingTransactions.clear();
        
        console.log('🛑 Compliance Integration destroyed');
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.ComplianceIntegration = ComplianceIntegration;
    
    // Initialize compliance when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.complianceIntegration = new ComplianceIntegration();
        });
    } else {
        window.complianceIntegration = new ComplianceIntegration();
    }
}

export { ComplianceIntegration };
