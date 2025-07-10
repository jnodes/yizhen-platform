// compliance-testing.spec.js - Comprehensive testing suite for Yizhen compliance system
// Tests all aspects of compliance integration across the platform

import { ComplianceAIAgent, RiskMonitoringAgent } from './compliance-ai-agent.js';
import { ComplianceIntegration } from './compliance-integration.js';
import { Web3Manager } from './assets/js/web3.js';

// Test utilities
class ComplianceTestUtils {
    static generateTestWallet() {
        return '0x' + Array(40).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    static generateTestTransaction() {
        return {
            from: this.generateTestWallet(),
            to: this.generateTestWallet(),
            value: Math.floor(Math.random() * 100000),
            data: '0x',
            timestamp: Date.now()
        };
    }

    static async mockWeb3Provider() {
        return {
            request: jest.fn(),
            on: jest.fn(),
            removeListener: jest.fn(),
            send: jest.fn()
        };
    }
}

// Unit Tests for Compliance AI Agent
describe('ComplianceAIAgent', () => {
    let agent;
    
    beforeEach(() => {
        agent = new ComplianceAIAgent({
            demoMode: true,
            riskThreshold: 0.7
        });
    });

    describe('KYC Verification', () => {
        test('should initiate KYC for new wallet', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            const result = await agent.performKYC(wallet);
            
            expect(result).toBeDefined();
            expect(result.status).toBe('verified'); // Demo mode auto-verifies
            expect(result.verificationId).toMatch(/^KYC-\d+-\w+$/);
        });

        test('should return existing KYC if already verified', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            // First verification
            const first = await agent.performKYC(wallet);
            // Second should return cached
            const second = await agent.performKYC(wallet);
            
            expect(second.verificationId).toBe(first.verificationId);
        });

        test('should handle KYC failure gracefully', async () => {
            agent.config.demoMode = false;
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            // Mock failed API response
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            
            const result = await agent.performKYC(wallet);
            expect(result.status).toBe('failed');
            expect(result.error).toBeDefined();
        });
    });

    describe('AML Screening', () => {
        test('should detect suspicious transaction patterns', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            // Mock transaction history with suspicious pattern
            agent.getTransactionHistory = jest.fn().mockResolvedValue([
                { amount: 9999, timestamp: Date.now() - 3600000 },
                { amount: 9998, timestamp: Date.now() - 7200000 },
                { amount: 9997, timestamp: Date.now() - 10800000 }
            ]);
            
            const result = await agent.performAML(wallet);
            
            expect(result.status).not.toBe('clear');
            expect(result.flags).toHaveLength(1);
            expect(result.flags[0].type).toBe('pattern');
        });

        test('should detect mixer usage', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            agent.checkMixerUsage = jest.fn().mockResolvedValue(true);
            
            const result = await agent.performAML(wallet);
            
            expect(result.flags).toContainEqual({
                type: 'mixer',
                detail: 'Mixer usage detected'
            });
        });

        test('should calculate AML risk score correctly', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            agent.queryAMLProviders = jest.fn().mockResolvedValue({
                chainalysis: { risk: 0.6 },
                elliptic: { risk: 0.7 }
            });
            
            const result = await agent.performAML(wallet);
            
            expect(result.score).toBeGreaterThan(0.5);
            expect(result.score).toBeLessThanOrEqual(1);
        });
    });

    describe('Sanctions Checking', () => {
        test('should check multiple sanctions lists', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            const checkSpy = jest.spyOn(agent, 'checkSanctionsList');
            
            await agent.checkSanctions(wallet);
            
            expect(checkSpy).toHaveBeenCalledTimes(agent.config.sanctionLists.length);
        });

        test('should block sanctioned addresses', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            
            agent.checkSanctionsList = jest.fn().mockResolvedValue({
                match: true,
                matchType: 'exact',
                confidence: 1.0,
                details: { list: 'OFAC', addedDate: '2023-01-01' }
            });
            
            const result = await agent.checkSanctions(wallet);
            
            expect(result.status).toBe('blocked');
            expect(result.matches).toHaveLength(agent.config.sanctionLists.length);
        });
    });

    describe('Risk Score Calculation', () => {
        test('should calculate weighted risk score', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            const tx = ComplianceTestUtils.generateTestTransaction();
            
            // Mock risk factors
            agent.getWalletAge = jest.fn().mockResolvedValue(0.8); // High risk (new)
            agent.getTransactionVolume = jest.fn().mockResolvedValue(0.3);
            agent.assessGeographicRisk = jest.fn().mockResolvedValue(0.5);
            
            const result = await agent.calculateRiskScore(wallet, tx);
            
            expect(result.score).toBeGreaterThan(0);
            expect(result.score).toBeLessThanOrEqual(1);
            expect(result.category).toBeDefined();
            expect(result.factors).toHaveProperty('walletAge');
        });

        test('should categorize risk levels correctly', () => {
            expect(agent.getRiskCategory(0.2)).toBe('low');
            expect(agent.getRiskCategory(0.4)).toBe('medium');
            expect(agent.getRiskCategory(0.6)).toBe('high');
            expect(agent.getRiskCategory(0.9)).toBe('critical');
        });
    });

    describe('Transaction Pattern Analysis', () => {
        test('should detect structuring patterns', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            const currentTx = { amount: 9500, timestamp: Date.now() };
            
            agent.getRecentTransactions = jest.fn().mockResolvedValue([
                { amount: 9800, timestamp: Date.now() - 3600000 },
                { amount: 9700, timestamp: Date.now() - 7200000 },
                { amount: 9600, timestamp: Date.now() - 10800000 }
            ]);
            
            const result = await agent.analyzeTransactionPatterns(wallet, currentTx);
            
            expect(result.patterns.structuring).toBe(true);
        });

        test('should detect rapid movement', async () => {
            const wallet = ComplianceTestUtils.generateTestWallet();
            const now = Date.now();
            
            agent.getRecentTransactions = jest.fn().mockResolvedValue([
                { amount: 1000, timestamp: now - 60000 }, // 1 minute ago
                { amount: 2000, timestamp: now - 120000 }, // 2 minutes ago
                { amount: 3000, timestamp: now - 180000 }, // 3 minutes ago
                { amount: 4000, timestamp: now - 240000 } // 4 minutes ago
            ]);
            
            const result = await agent.analyzeTransactionPatterns(wallet);
            
            expect(result.patterns.rapidMovement).toBe(true);
        });
    });

    describe('Compliance Result Aggregation', () => {
        test('should determine overall status correctly', () => {
            const results = {
                sanctionsResult: { status: 'clear' },
                jurisdictionCheck: { status: 'allowed' },
                amlResult: { status: 'clear' },
                kycResult: { status: 'verified' },
                riskScore: { score: 0.3 },
                transactionAnalysis: { status: 'normal' }
            };
            
            expect(agent.determineOverallStatus(results)).toBe('approved');
            
            // Test blocked status
            results.sanctionsResult.status = 'blocked';
            expect(agent.determineOverallStatus(results)).toBe('blocked');
        });
    });
});

// Integration Tests
describe('ComplianceIntegration', () => {
    let integration;
    let mockWeb3Manager;
    let mockProvider;
    
    beforeEach(async () => {
        mockProvider = await ComplianceTestUtils.mockWeb3Provider();
        window.ethereum = mockProvider;
        
        mockWeb3Manager = new Web3Manager();
        mockWeb3Manager.provider = mockProvider;
        mockWeb3Manager.userAccount = ComplianceTestUtils.generateTestWallet();
        
        window.app = { web3Manager: mockWeb3Manager };
        
        integration = new ComplianceIntegration();
        await integration.waitForWeb3();
    });

    afterEach(() => {
        integration.destroy();
        delete window.ethereum;
        delete window.app;
    });

    describe('Wallet Connection Integration', () => {
        test('should run compliance check on wallet connect', async () => {
            const checkSpy = jest.spyOn(integration, 'checkWalletCompliance');
            
            mockProvider.request.mockResolvedValue([mockWeb3Manager.userAccount]);
            
            await mockWeb3Manager.connectWallet();
            
            expect(checkSpy).toHaveBeenCalledWith(mockWeb3Manager.userAccount);
        });

        test('should block sanctioned wallets', async () => {
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'blocked',
                sanctions: { status: 'blocked' }
            });
            
            const handleBlockedSpy = jest.spyOn(integration, 'handleBlockedWallet');
            
            const result = await mockWeb3Manager.connectWallet();
            
            expect(result).toBe(false);
            expect(handleBlockedSpy).toHaveBeenCalled();
        });

        test('should show KYC modal for pending verification', async () => {
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'pending-verification',
                kyc: { status: 'pending' }
            });
            
            const showKYCSpy = jest.spyOn(integration, 'showKYCModal');
            
            await mockWeb3Manager.connectWallet();
            
            expect(showKYCSpy).toHaveBeenCalled();
        });
    });

    describe('Transaction Compliance', () => {
        test('should check compliance before bid placement', async () => {
            const preCheckSpy = jest.spyOn(integration, 'preTransactionCheck');
            
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'approved',
                kyc: { status: 'verified' }
            });
            
            await mockWeb3Manager.placeBid(1, 5000);
            
            expect(preCheckSpy).toHaveBeenCalled();
        });

        test('should require KYC for high-value bids', async () => {
            const requestKYCSpy = jest.spyOn(integration, 'requestKYC');
            
            integration.config.maxBidWithoutKYC = 10000;
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'conditional-approval',
                kyc: { status: 'pending' }
            });
            
            const result = await mockWeb3Manager.placeBid(1, 15000);
            
            expect(requestKYCSpy).toHaveBeenCalled();
            expect(result).toBe(false);
        });

        test('should track pending transactions', async () => {
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'approved',
                kyc: { status: 'verified' }
            });
            
            await mockWeb3Manager.placeBid(1, 5000);
            
            expect(integration.pendingTransactions.size).toBe(1);
        });
    });

    describe('Risk Monitoring', () => {
        test('should start monitoring on wallet connect', async () => {
            const startMonitoringSpy = jest.spyOn(integration.riskMonitor, 'startMonitoring');
            
            integration.config.realTimeMonitoring = true;
            integration.complianceAgent.checkCompliance = jest.fn().mockResolvedValue({
                overallStatus: 'approved'
            });
            
            await mockWeb3Manager.connectWallet();
            
            expect(startMonitoringSpy).toHaveBeenCalledWith(mockWeb3Manager.userAccount);
        });

        test('should stop monitoring on account change', async () => {
            const stopMonitoringSpy = jest.spyOn(integration.riskMonitor, 'stopMonitoring');
            const oldAccount = mockWeb3Manager.userAccount;
            
            // Simulate account change
            const newAccount = ComplianceTestUtils.generateTestWallet();
            mockProvider.on.mock.calls.find(call => call[0] === 'accountsChanged')[1]([newAccount]);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(stopMonitoringSpy).toHaveBeenCalledWith(oldAccount);
        });
    });

    describe('UI Updates', () => {
        test('should update compliance UI elements', () => {
            document.body.innerHTML = `
                <button class="connect-wallet">
                    <span id="wallet-text">Connected</span>
                </button>
                <div id="compliance-risk-score"></div>
                <div id="kyc-status"></div>
            `;
            
            integration.updateComplianceUI({
                overallStatus: 'approved',
                riskScore: { score: 0.3, category: 'low' },
                kyc: { status: 'verified' }
            });
            
            const indicator = document.querySelector('.compliance-indicator');
            expect(indicator).toBeTruthy();
            expect(indicator.innerHTML).toBe('✅');
            
            const riskWidget = document.getElementById('compliance-risk-score');
            expect(riskWidget.textContent).toContain('30%');
        });
    });
});

// End-to-End Tests
describe('E2E Compliance Flow', () => {
    let page;
    
    beforeAll(async () => {
        // Setup browser environment
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
    });

    afterAll(async () => {
        await page.close();
    });

    test('should complete full compliance flow', async () => {
        // Connect wallet
        await page.click('#connect-wallet-btn');
        await page.waitForSelector('.compliance-loading');
        
        // Wait for compliance check
        await page.waitForSelector('.compliance-indicator', { timeout: 10000 });
        
        // Verify KYC modal appears
        const kycModal = await page.$('.kyc-modal');
        expect(kycModal).toBeTruthy();
        
        // Start KYC process
        await page.click('button:contains("Start Verification")');
        
        // Wait for demo KYC completion
        await page.waitForSelector('.toast.success', { timeout: 5000 });
        
        // Verify can now place bid
        await page.click('.artifact-card:first-child');
        await page.waitForSelector('.modal');
        
        await page.type('#bid-amount', '5000');
        await page.click('.bid-button');
        
        // Verify bid success
        await page.waitForSelector('.toast.success');
    });

    test('should block high-risk wallets', async () => {
        // Mock high-risk wallet
        await page.evaluate(() => {
            window.complianceIntegration.complianceAgent.checkCompliance = () => Promise.resolve({
                overallStatus: 'blocked',
                sanctions: { status: 'blocked', matches: [{ list: 'OFAC' }] }
            });
        });
        
        // Try to connect
        await page.click('#connect-wallet-btn');
        
        // Verify blocked modal
        await page.waitForSelector('.compliance-blocked');
        const blockText = await page.$eval('.compliance-blocked h3', el => el.textContent);
        expect(blockText).toContain('restricted');
    });

    test('should enforce transaction limits', async () => {
        // Connect verified wallet
        await page.click('#connect-wallet-btn');
        await page.waitForSelector('.compliance-indicator');
        
        // Try to place bid over limit
        await page.click('.artifact-card:first-child');
        await page.waitForSelector('.modal');
        
        await page.type('#bid-amount', '50000'); // Over KYC limit
        await page.click('.bid-button');
        
        // Verify KYC required modal
        await page.waitForSelector('.kyc-required');
        const kycText = await page.$eval('.kyc-required p', el => el.textContent);
        expect(kycText).toContain('require identity verification');
    });
});

// Performance Tests
describe('Compliance Performance', () => {
    let agent;
    
    beforeEach(() => {
        agent = new ComplianceAIAgent({ demoMode: true });
    });

    test('should complete compliance check within 3 seconds', async () => {
        const wallet = ComplianceTestUtils.generateTestWallet();
        const start = Date.now();
        
        await agent.checkCompliance(wallet);
        
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(3000);
    });

    test('should handle concurrent compliance checks', async () => {
        const wallets = Array(10).fill(0).map(() => ComplianceTestUtils.generateTestWallet());
        
        const start = Date.now();
        const results = await Promise.all(
            wallets.map(wallet => agent.checkCompliance(wallet))
        );
        const duration = Date.now() - start;
        
        expect(results).toHaveLength(10);
        expect(duration).toBeLessThan(5000); // Should parallelize
    });

    test('should cache results effectively', async () => {
        const wallet = ComplianceTestUtils.generateTestWallet();
        
        // First call
        const start1 = Date.now();
        await agent.checkCompliance(wallet);
        const duration1 = Date.now() - start1;
        
        // Second call (should use cache)
        const start2 = Date.now();
        await agent.checkCompliance(wallet);
        const duration2 = Date.now() - start2;
        
        expect(duration2).toBeLessThan(duration1 / 10); // Much faster
    });
});

// RAG System Tests
describe('RAG Integration', () => {
    let agent;
    
    beforeEach(() => {
        agent = new ComplianceAIAgent({
            ragEndpoint: 'http://localhost:8000/rag'
        });
    });

    test('should query RAG for recommendations', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => [{
                type: 'regulatory',
                priority: 'high',
                action: 'File SAR',
                details: 'Suspicious activity detected'
            }]
        });
        
        const recommendations = await agent.queryRAGSystem(
            'suspicious transaction patterns',
            { patterns: ['structuring', 'rapid-movement'] }
        );
        
        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].type).toBe('regulatory');
    });

    test('should handle RAG failures gracefully', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('RAG service unavailable'));
        
        const recommendations = await agent.queryRAGSystem('test query', {});
        
        expect(recommendations).toBeNull();
    });
});

// Monitoring Tests
describe('Risk Monitoring', () => {
    let monitor;
    let agent;
    
    beforeEach(() => {
        agent = new ComplianceAIAgent({ demoMode: true });
        monitor = new RiskMonitoringAgent(agent);
    });

    test('should detect threshold breaches', async () => {
        const wallet = ComplianceTestUtils.generateTestWallet();
        
        agent.checkCompliance = jest.fn().mockResolvedValue({
            overallStatus: 'high-risk',
            riskScore: { score: 0.9 },
            transactionAnalysis: {
                patterns: {
                    structuring: true,
                    rapidMovement: true,
                    unusualTiming: true,
                    highRiskCounterparties: true
                }
            }
        });
        
        const handleBreachesSpy = jest.spyOn(monitor, 'handleBreaches');
        
        await monitor.performMonitoringCheck(wallet);
        
        expect(handleBreachesSpy).toHaveBeenCalled();
    });

    test('should generate monitoring reports', async () => {
        const wallet = ComplianceTestUtils.generateTestWallet();
        
        monitor.startMonitoring(wallet);
        
        // Simulate some alerts
        monitor.alerts.get(wallet).alertHistory = [
            { timestamp: Date.now() - 3600000, breach: { type: 'risk-score', severity: 'high' } },
            { timestamp: Date.now() - 1800000, breach: { type: 'suspicious-patterns', severity: 'critical' } }
        ];
        
        const report = monitor.getMonitoringReport(wallet);
        
        expect(report.totalAlerts).toBe(2);
        expect(report.criticalAlerts).toBe(1);
        expect(report.highAlerts).toBe(1);
        
        monitor.stopMonitoring(wallet);
    });
});

// Run all tests
if (require.main === module) {
    const { exec } = require('child_process');
    exec('jest --coverage --verbose', (error, stdout, stderr) => {
        console.log(stdout);
        if (error) {
            console.error(stderr);
            process.exit(1);
        }
    });
}

export { ComplianceTestUtils };
