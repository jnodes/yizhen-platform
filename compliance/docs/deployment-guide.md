# Compliance AI System - Deployment & Integration Guide

## Overview

This guide covers the deployment and integration of the regulatory compliance AI agents for the Yizhen Chinese ceramics NFT auction platform. The system provides comprehensive KYC/AML compliance, sanctions screening, risk assessment, and real-time transaction monitoring.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Yizhen Platform Frontend                  │
├─────────────────────────────────────────────────────────────┤
│                   Compliance Integration Layer                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Wallet Hooks │  │ Transaction  │  │    UI Updates    │  │
│  │              │  │   Interceptor │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Compliance AI Agents                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ KYC/AML Agent│  │Risk Monitor  │  │  RAG System      │  │
│  │              │  │   Agent      │  │   Interface      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ KYC Provider │  │AML Analytics │  │ Sanctions Lists  │  │
│  │  (Sumsub)    │  │(Chainalysis) │  │  (OFAC, EU)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### 1. Environment Requirements
- [ ] Node.js 16+ installed
- [ ] Ethereum node access (Infura/Alchemy)
- [ ] API keys for compliance services
- [ ] RAG system endpoint configured
- [ ] SSL certificates for production

### 2. Required API Keys
```env
# .env file
RAG_ENDPOINT=https://rag.yizhen-compliance.com
RAG_API_KEY=your-rag-api-key
KYC_PROVIDER_API_KEY=your-sumsub-api-key
AML_PROVIDER_API_KEY=your-chainalysis-api-key
SANCTIONS_API_KEY=your-sanctions-api-key
```

### 3. Compliance Configuration
```javascript
// config/compliance.config.js
export const complianceConfig = {
    // Operational Mode
    mode: 'production', // 'demo', 'test', 'production'
    complianceMode: 'strict', // 'strict', 'moderate', 'light'
    
    // Thresholds
    maxBidWithoutKYC: 10000, // USD
    riskThreshold: 0.7,
    transactionVelocityLimit: 10, // per hour
    
    // Jurisdictions
    allowedJurisdictions: ['US', 'EU', 'UK', 'HK', 'SG'],
    restrictedJurisdictions: ['KP', 'IR', 'CU', 'SY'],
    
    // Monitoring
    realTimeMonitoring: true,
    monitoringInterval: 60000, // 1 minute
    alertThresholds: {
        riskScore: 0.7,
        suspiciousPatterns: 3,
        velocity: 10,
        volume: 100000
    }
};
```

## Integration Steps

### Step 1: Install Dependencies

```bash
# Install compliance system dependencies
npm install ethers@6.11.1
npm install @sumsub/websdk-react  # KYC provider
npm install chainalysis-api       # AML analytics

# Development dependencies for testing
npm install --save-dev jest @testing-library/react puppeteer
```

### Step 2: Add Compliance Files

```bash
# Copy compliance files to your project
cp compliance-ai-agent.js public/assets/js/
cp compliance-integration.js public/assets/js/
cp compliance-testing.spec.js tests/

# Update index.html to include compliance scripts
```

### Step 3: Modify index.html

Add the compliance scripts before the closing body tag:

```html
<!-- Add after web3.js but before app.js -->
<script src="/assets/js/compliance-ai-agent.js" type="module"></script>
<script src="/assets/js/compliance-integration.js" type="module"></script>
```

### Step 4: Update Web3 Manager

The compliance integration automatically hooks into the Web3Manager, but ensure your `web3.js` exports the class:

```javascript
// At the end of web3.js
export { Web3Manager };
```

### Step 5: Add Compliance UI Elements

Add these elements to your HTML for compliance status display:

```html
<!-- Add to header near wallet button -->
<div id="compliance-status" class="compliance-widgets">
    <div id="kyc-status"></div>
    <div id="compliance-risk-score"></div>
</div>

<!-- Add compliance styles -->
<style>
.compliance-indicator {
    margin-left: 8px;
    font-size: 14px;
}

.compliance-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.compliance-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3000;
}

.compliance-blocked {
    text-align: center;
    padding: 2rem;
}

.kyc-modal {
    max-width: 500px;
    margin: 0 auto;
}

.risk-score-display .low { color: #28a745; }
.risk-score-display .medium { color: #ffc107; }
.risk-score-display .high { color: #dc3545; }
.risk-score-display .critical { color: #721c24; }
</style>
```

## Configuration Options

### 1. Compliance Modes

**Strict Mode** (Recommended for US/EU operations)
- Blocks all high-risk transactions
- Requires KYC for bids over $10,000
- Sanctions checking on every transaction
- Real-time monitoring enabled

**Moderate Mode** (For established markets)
- Manual review for high-risk transactions
- KYC required for bids over $25,000
- Daily sanctions checking
- Periodic monitoring

**Light Mode** (For low-risk jurisdictions)
- Only blocks sanctioned addresses
- KYC optional but recommended
- Weekly sanctions checking
- Monitoring on request

### 2. KYC Integration

**Sumsub Integration**
```javascript
// Initialize Sumsub SDK
const snsWebSdkInstance = snsWebSdk.init(
    accessToken,
    () => this.getAccessToken()
)
.withConf({
    lang: 'en',
    theme: 'light'
})
.withOptions({ addViewportTag: false })
.on('idCheck.onStepCompleted', (payload) => {
    console.log('Step completed:', payload);
})
.on('idCheck.onError', (error) => {
    console.error('KYC error:', error);
})
.build();

// Launch KYC flow
snsWebSdkInstance.launch('#sumsub-websdk-container');
```

### 3. AML Provider Setup

**Chainalysis Integration**
```javascript
const chainalysisClient = new ChainalysisAPI({
    apiKey: process.env.CHAINALYSIS_API_KEY,
    network: 'ethereum'
});

// Check address risk
const risk = await chainalysisClient.getAddressRisk(walletAddress);
```

## Deployment Process

### 1. Development Environment

```bash
# Start local development
npm run dev

# Run compliance tests
npm test -- compliance-testing.spec.js

# Check coverage
npm run test:coverage
```

### 2. Staging Deployment

```bash
# Build for staging
npm run build:staging

# Deploy to Vercel staging
vercel --prod --env=staging

# Run E2E tests
npm run test:e2e:staging
```

### 3. Production Deployment

```bash
# Final security audit
npm audit fix

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Monitor deployment
vercel logs --follow
```

## Monitoring & Maintenance

### 1. Compliance Dashboard

Access the compliance dashboard at `/admin/compliance` (requires admin auth):

- Real-time risk monitoring
- KYC verification queue
- Sanctions list updates
- Transaction analysis
- Compliance reports

### 2. Alert Configuration

```javascript
// Set up alert webhooks
const alertWebhook = 'https://your-slack-webhook.com';

// Critical alerts
if (breach.severity === 'critical') {
    await sendAlert(alertWebhook, {
        text: `🚨 CRITICAL: ${breach.type} detected for ${walletAddress}`,
        channel: '#compliance-alerts'
    });
}
```

### 3. Regular Updates

**Daily Tasks:**
- Review high-risk transaction queue
- Process pending KYC verifications
- Check system health metrics

**Weekly Tasks:**
- Update sanctions lists
- Review compliance reports
- Audit false positives

**Monthly Tasks:**
- Update risk models
- Review jurisdiction regulations
- Performance optimization

## Troubleshooting

### Common Issues

**1. KYC Provider Connection Failed**
```javascript
// Check API key and endpoint
console.log('KYC Provider Status:', await checkKYCProvider());

// Fallback to manual review
if (!kycAvailable) {
    return { status: 'manual-review', reason: 'KYC provider unavailable' };
}
```

**2. High False Positive Rate**
- Adjust risk thresholds in config
- Review transaction pattern detection
- Update RAG training data

**3. Performance Issues**
- Enable caching for compliance checks
- Implement request batching
- Use CDN for static resources

### Debug Mode

Enable debug logging:
```javascript
// Enable in development
localStorage.setItem('compliance_debug', 'true');

// View detailed logs
window.complianceIntegration.complianceAgent.debug = true;
```

## Security Considerations

### 1. API Key Management
- Never expose API keys in frontend code
- Use environment variables
- Rotate keys regularly
- Implement rate limiting

### 2. Data Privacy
- Encrypt sensitive user data
- Comply with GDPR/CCPA
- Implement data retention policies
- Regular security audits

### 3. Access Control
```javascript
// Implement role-based access
const userRole = await getUserRole(walletAddress);
const hasAccess = checkComplianceAccess(userRole, 'view-reports');
```

## Testing Guide

### 1. Unit Tests
```bash
# Run all unit tests
npm test -- --testPathPattern=compliance

# Test specific module
npm test -- compliance-ai-agent.spec.js
```

### 2. Integration Tests
```bash
# Test wallet integration
npm test -- --testNamePattern="Wallet Connection"

# Test transaction flow
npm test -- --testNamePattern="Transaction Compliance"
```

### 3. E2E Tests
```bash
# Run Puppeteer tests
npm run test:e2e

# Test specific flows
npm run test:e2e -- --grep "compliance flow"
```

## Performance Optimization

### 1. Caching Strategy
```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache compliance results
await client.setex(
    `compliance:${walletAddress}`,
    300, // 5 minutes
    JSON.stringify(complianceResult)
);
```

### 2. Request Batching
```javascript
// Batch sanctions checks
const batchCheckSanctions = async (addresses) => {
    const chunks = chunk(addresses, 100);
    const results = await Promise.all(
        chunks.map(chunk => checkSanctionsBatch(chunk))
    );
    return results.flat();
};
```

### 3. Lazy Loading
```javascript
// Load compliance module on demand
const loadCompliance = () => import('./compliance-integration.js');

// Initialize when needed
if (userNeedsCompliance) {
    const { ComplianceIntegration } = await loadCompliance();
    window.complianceIntegration = new ComplianceIntegration();
}
```

## Support & Resources

### Documentation
- [API Reference](https://docs.yizhen-compliance.com)
- [Integration Examples](https://github.com/yizhen/compliance-examples)
- [Best Practices Guide](https://compliance.yizhen.com/best-practices)

### Support Channels
- Email: compliance@yizhen.com
- Slack: #compliance-support
- Emergency: +1-XXX-XXX-XXXX

### Compliance Partners
- KYC: Sumsub (https://sumsub.com)
- AML: Chainalysis (https://chainalysis.com)
- Legal: [Your Legal Partner]

## Appendix: Regulatory References

### US Regulations
- Bank Secrecy Act (BSA)
- USA PATRIOT Act
- FinCEN Guidance FIN-2019-G001

### EU Regulations
- 5th Anti-Money Laundering Directive (5AMLD)
- Markets in Crypto-Assets (MiCA)
- GDPR Requirements

### Asia-Pacific Regulations
- Hong Kong: AMLO Chapter 615
- Singapore: PS Act 2019
- Japan: PSA & FIEA

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Maintained by:** Yizhen Compliance Team
