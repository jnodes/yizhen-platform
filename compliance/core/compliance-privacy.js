// compliance-privacy.js - Data Privacy and GDPR Compliance Module for Yizhen Platform

import crypto from 'crypto';

/**
 * Privacy Compliance Manager
 * Handles GDPR, CCPA, and other privacy regulations
 */
class PrivacyComplianceManager {
    constructor(config = {}) {
        this.config = {
            // Encryption settings
            encryption: {
                algorithm: config.encryptionAlgorithm || 'aes-256-gcm',
                keyDerivation: config.keyDerivation || 'pbkdf2',
                iterations: config.iterations || 100000,
                saltLength: config.saltLength || 32
            },
            
            // Data retention policies
            retention: {
                kycData: config.kycRetention || 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
                transactionData: config.transactionRetention || 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
                personalData: config.personalRetention || 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
                marketingData: config.marketingRetention || 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
                logData: config.logRetention || 90 * 24 * 60 * 60 * 1000 // 90 days
            },
            
            // Privacy settings
            privacy: {
                anonymizeAfter: config.anonymizeAfter || 30 * 24 * 60 * 60 * 1000, // 30 days
                pseudonymization: config.pseudonymization || true,
                minimization: config.minimization || true,
                encryption: config.encryptionEnabled || true
            },
            
            // Consent management
            consent: {
                requireExplicit: true,
                granular: true,
                withdrawable: true,
                trackingEnabled: true
            },
            
            // Jurisdictions
            jurisdictions: config.jurisdictions || ['GDPR', 'CCPA', 'LGPD', 'PIPEDA']
        };
        
        this.dataInventory = new Map();
        this.consentRecords = new Map();
        this.processingActivities = new Map();
        this.dataRequests = new Map();
        this.encryptionKeys = new Map();
        
        this.initialize();
    }

    initialize() {
        console.log('🔐 Privacy Compliance Manager initialized');
        
        // Set up encryption keys
        this.setupEncryption();
        
        // Initialize data categories
        this.initializeDataCategories();
        
        // Start retention scheduler
        this.startRetentionScheduler();
    }

    /**
     * Process personal data with privacy controls
     */
    async processPersonalData(dataSubject, data, purpose, legalBasis) {
        // Check consent
        const hasConsent = await this.checkConsent(dataSubject, purpose);
        
        if (!hasConsent && legalBasis !== 'legitimate-interest' && legalBasis !== 'legal-obligation') {
            throw new Error('No valid consent or legal basis for processing');
        }
        
        // Log processing activity
        const activityId = this.logProcessingActivity({
            dataSubject,
            timestamp: Date.now(),
            purpose,
            legalBasis,
            dataCategories: this.categorizeData(data),
            retention: this.getRetentionPeriod(purpose)
        });
        
        // Apply privacy enhancements
        const processedData = await this.applyPrivacyEnhancements(data, {
            minimize: this.config.privacy.minimization,
            pseudonymize: this.config.privacy.pseudonymization,
            encrypt: this.config.privacy.encryption
        });
        
        // Store with metadata
        this.storeData(dataSubject, {
            data: processedData,
            activityId,
            purpose,
            legalBasis,
            timestamp: Date.now(),
            retention: this.getRetentionPeriod(purpose)
        });
        
        return {
            activityId,
            status: 'processed',
            privacyEnhancements: ['minimization', 'pseudonymization', 'encryption']
        };
    }

    /**
     * Handle data subject rights requests
     */
    async handleDataRequest(requestType, dataSubject, requestData = {}) {
        const requestId = this.generateRequestId();
        const request = {
            id: requestId,
            type: requestType,
            dataSubject,
            timestamp: Date.now(),
            status: 'pending',
            data: requestData
        };
        
        this.dataRequests.set(requestId, request);
        
        try {
            let result;
            
            switch (requestType) {
                case 'access':
                    result = await this.handleAccessRequest(dataSubject);
                    break;
                    
                case 'portability':
                    result = await this.handlePortabilityRequest(dataSubject);
                    break;
                    
                case 'rectification':
                    result = await this.handleRectificationRequest(dataSubject, requestData);
                    break;
                    
                case 'erasure':
                    result = await this.handleErasureRequest(dataSubject, requestData);
                    break;
                    
                case 'restriction':
                    result = await this.handleRestrictionRequest(dataSubject, requestData);
                    break;
                    
                case 'objection':
                    result = await this.handleObjectionRequest(dataSubject, requestData);
                    break;
                    
                default:
                    throw new Error(`Unknown request type: ${requestType}`);
            }
            
            request.status = 'completed';
            request.completedAt = Date.now();
            request.result = result;
            
            return result;
            
        } catch (error) {
            request.status = 'failed';
            request.error = error.message;
            throw error;
        }
    }

    /**
     * Handle access request (GDPR Article 15)
     */
    async handleAccessRequest(dataSubject) {
        console.log(`📋 Processing access request for ${dataSubject}`);
        
        const userData = await this.collectAllUserData(dataSubject);
        const report = {
            requestDate: new Date().toISOString(),
            dataSubject,
            personalData: {},
            processingPurposes: [],
            dataCategories: [],
            recipients: [],
            retention: {},
            rights: this.getDataSubjectRights(),
            sources: []
        };
        
        // Organize data by category
        for (const [category, data] of userData.entries()) {
            report.personalData[category] = await this.decryptData(data);
            report.dataCategories.push(category);
            
            // Add processing information
            const activities = this.getProcessingActivities(dataSubject, category);
            report.processingPurposes.push(...activities.map(a => a.purpose));
            
            // Add retention information
            report.retention[category] = this.getRetentionInfo(category);
        }
        
        // Generate secure download link
        const downloadLink = await this.generateSecureDownload(report, dataSubject);
        
        return {
            reportId: this.generateReportId(),
            downloadLink,
            expiresIn: 48 * 60 * 60 * 1000, // 48 hours
            format: 'json',
            summary: {
                categories: report.dataCategories.length,
                purposes: [...new Set(report.processingPurposes)].length,
                retentionPeriods: Object.keys(report.retention).length
            }
        };
    }

    /**
     * Handle portability request (GDPR Article 20)
     */
    async handlePortabilityRequest(dataSubject) {
        console.log(`📦 Processing portability request for ${dataSubject}`);
        
        const portableData = await this.collectPortableData(dataSubject);
        
        // Format data according to standards
        const formattedData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            dataSubject: this.pseudonymize(dataSubject),
            data: {}
        };
        
        // Only include data that meets portability criteria
        for (const [category, data] of portableData.entries()) {
            if (this.isPortable(category)) {
                formattedData.data[category] = await this.formatForPortability(data);
            }
        }
        
        // Create multiple format options
        const formats = {
            json: await this.exportAsJSON(formattedData),
            csv: await this.exportAsCSV(formattedData),
            xml: await this.exportAsXML(formattedData)
        };
        
        return {
            formats: Object.keys(formats),
            downloads: formats,
            schema: this.getDataSchema(),
            interoperable: true
        };
    }

    /**
     * Handle erasure request (GDPR Article 17 - Right to be forgotten)
     */
    async handleErasureRequest(dataSubject, requestData) {
        console.log(`🗑️ Processing erasure request for ${dataSubject}`);
        
        // Check if erasure is allowed
        const erasureCheck = await this.checkErasureEligibility(dataSubject);
        
        if (!erasureCheck.eligible) {
            return {
                status: 'denied',
                reason: erasureCheck.reason,
                legalGrounds: erasureCheck.legalGrounds,
                alternativeAction: erasureCheck.alternative
            };
        }
        
        // Perform erasure
        const erasureResult = {
            dataSubject: this.pseudonymize(dataSubject),
            timestamp: Date.now(),
            categories: [],
            retainedData: [],
            notifications: []
        };
        
        // Erase data by category
        const userData = await this.collectAllUserData(dataSubject);
        
        for (const [category, data] of userData.entries()) {
            if (this.canErase(category, data)) {
                await this.eraseData(dataSubject, category);
                erasureResult.categories.push(category);
            } else {
                // Data that must be retained
                erasureResult.retainedData.push({
                    category,
                    reason: this.getRetentionReason(category),
                    until: this.getRetentionEndDate(category)
                });
            }
        }
        
        // Notify third parties
        const notifications = await this.notifyThirdParties(dataSubject, 'erasure');
        erasureResult.notifications = notifications;
        
        // Log the erasure
        await this.logErasure(erasureResult);
        
        return erasureResult;
    }

    /**
     * Consent management
     */
    async recordConsent(dataSubject, consentData) {
        const consentRecord = {
            id: this.generateConsentId(),
            dataSubject,
            timestamp: Date.now(),
            purposes: consentData.purposes,
            granted: consentData.granted,
            version: consentData.version || '1.0',
            method: consentData.method || 'explicit',
            withdrawable: true,
            expiry: consentData.expiry || null,
            metadata: {
                ip: consentData.ip,
                userAgent: consentData.userAgent,
                source: consentData.source
            }
        };
        
        // Store consent record
        const userConsents = this.consentRecords.get(dataSubject) || [];
        userConsents.push(consentRecord);
        this.consentRecords.set(dataSubject, userConsents);
        
        // Audit log
        await this.auditLog('consent-granted', {
            dataSubject,
            consentId: consentRecord.id,
            purposes: consentData.purposes
        });
        
        return consentRecord;
    }

    async withdrawConsent(dataSubject, purposes = []) {
        const userConsents = this.consentRecords.get(dataSubject) || [];
        const withdrawalRecord = {
            id: this.generateWithdrawalId(),
            timestamp: Date.now(),
            purposes: purposes.length > 0 ? purposes : 'all',
            previousConsents: []
        };
        
        // Update consent records
        userConsents.forEach(consent => {
            if (purposes.length === 0 || purposes.some(p => consent.purposes.includes(p))) {
                consent.withdrawn = true;
                consent.withdrawnAt = Date.now();
                withdrawalRecord.previousConsents.push(consent.id);
            }
        });
        
        // Stop processing based on withdrawn consent
        await this.stopProcessing(dataSubject, purposes);
        
        // Audit log
        await this.auditLog('consent-withdrawn', {
            dataSubject,
            withdrawalId: withdrawalRecord.id,
            purposes
        });
        
        return withdrawalRecord;
    }

    /**
     * Privacy Impact Assessment (PIA)
     */
    async conductPIA(processingActivity) {
        const assessment = {
            id: this.generateAssessmentId(),
            timestamp: Date.now(),
            activity: processingActivity,
            risks: [],
            mitigations: [],
            residualRisk: 'low',
            recommendations: []
        };
        
        // Assess necessity and proportionality
        const necessity = this.assessNecessity(processingActivity);
        assessment.necessity = necessity;
        
        // Identify risks
        const risks = await this.identifyPrivacyRisks(processingActivity);
        assessment.risks = risks;
        
        // Propose mitigations
        for (const risk of risks) {
            const mitigation = this.proposeMitigation(risk);
            assessment.mitigations.push(mitigation);
        }
        
        // Calculate residual risk
        assessment.residualRisk = this.calculateResidualRisk(risks, assessment.mitigations);
        
        // Generate recommendations
        assessment.recommendations = this.generatePIARecommendations(assessment);
        
        return assessment;
    }

    /**
     * Data breach management
     */
    async handleDataBreach(breachData) {
        const breach = {
            id: this.generateBreachId(),
            timestamp: Date.now(),
            discovered: breachData.discoveredAt,
            type: breachData.type,
            severity: breachData.severity,
            affectedData: breachData.affectedData,
            affectedSubjects: breachData.affectedSubjects,
            status: 'investigating'
        };
        
        // Immediate actions
        const immediateActions = await this.takeImmediateActions(breach);
        breach.immediateActions = immediateActions;
        
        // Risk assessment
        const riskAssessment = await this.assessBreachRisk(breach);
        breach.riskAssessment = riskAssessment;
        
        // Notification requirements
        const notifications = {
            supervisoryAuthority: riskAssessment.risk >= 0.5,
            dataSubjects: riskAssessment.risk >= 0.7,
            deadline: this.getNotificationDeadline(breach)
        };
        breach.notifications = notifications;
        
        // Execute notifications if required
        if (notifications.supervisoryAuthority) {
            await this.notifySupervisoryAuthority(breach);
        }
        
        if (notifications.dataSubjects) {
            await this.notifyDataSubjects(breach);
        }
        
        // Log breach
        await this.logBreach(breach);
        
        return breach;
    }

    /**
     * Encryption and security methods
     */
    async encryptData(data, purpose = 'storage') {
        const key = await this.getEncryptionKey(purpose);
        const iv = crypto.randomBytes(16);
        const salt = crypto.randomBytes(this.config.encryption.saltLength);
        
        const cipher = crypto.createCipheriv(
            this.config.encryption.algorithm,
            key,
            iv
        );
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            salt: salt.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: this.config.encryption.algorithm,
            purpose
        };
    }

    async decryptData(encryptedData) {
        const key = await this.getEncryptionKey(encryptedData.purpose);
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const authTag = Buffer.from(encryptedData.authTag, 'hex');
        
        const decipher = crypto.createDecipheriv(
            encryptedData.algorithm,
            key,
            iv
        );
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Anonymization and pseudonymization
     */
    anonymize(data) {
        // Remove all identifying information
        const anonymized = { ...data };
        const identifiers = ['name', 'email', 'phone', 'address', 'ip', 'walletAddress'];
        
        identifiers.forEach(identifier => {
            if (anonymized[identifier]) {
                anonymized[identifier] = this.hashData(anonymized[identifier]);
            }
        });
        
        // Generalize quasi-identifiers
        if (anonymized.age) {
            anonymized.ageRange = this.generalizeAge(anonymized.age);
            delete anonymized.age;
        }
        
        if (anonymized.location) {
            anonymized.region = this.generalizeLocation(anonymized.location);
            delete anonymized.location;
        }
        
        return anonymized;
    }

    pseudonymize(identifier) {
        // Create consistent pseudonym
        const hmac = crypto.createHmac('sha256', this.getPseudonymizationKey());
        hmac.update(identifier);
        return `PSN-${hmac.digest('hex').substring(0, 16)}`;
    }

    /**
     * Data retention and deletion
     */
    async startRetentionScheduler() {
        setInterval(async () => {
            await this.enforceRetentionPolicies();
        }, 24 * 60 * 60 * 1000); // Daily
        
        // Run immediately on start
        await this.enforceRetentionPolicies();
    }

    async enforceRetentionPolicies() {
        console.log('🗓️ Enforcing data retention policies');
        
        const now = Date.now();
        let deletedCount = 0;
        
        for (const [dataSubject, inventory] of this.dataInventory.entries()) {
            for (const record of inventory) {
                if (record.retention && now > record.timestamp + record.retention) {
                    // Check if deletion is allowed
                    if (await this.canDelete(dataSubject, record)) {
                        await this.deleteExpiredData(dataSubject, record);
                        deletedCount++;
                    } else {
                        // Anonymize instead
                        await this.anonymizeExpiredData(dataSubject, record);
                    }
                }
            }
        }
        
        console.log(`♻️ Processed ${deletedCount} expired records`);
    }

    /**
     * Compliance reporting
     */
    async generateComplianceReport(period) {
        const report = {
            period,
            generated: new Date().toISOString(),
            metrics: {
                dataSubjects: this.dataInventory.size,
                processingActivities: this.processingActivities.size,
                consents: this.countConsents(),
                dataRequests: this.countDataRequests(period),
                breaches: await this.countBreaches(period),
                retentionCompliance: await this.checkRetentionCompliance()
            },
            risks: await this.assessOverallRisk(),
            recommendations: []
        };
        
        // Analyze trends
        report.trends = {
            consentRate: this.calculateConsentTrend(period),
            requestRate: this.calculateRequestTrend(period),
            breachRate: this.calculateBreachTrend(period)
        };
        
        // Generate recommendations
        if (report.metrics.retentionCompliance < 0.95) {
            report.recommendations.push({
                priority: 'high',
                area: 'retention',
                action: 'Review and update retention policies'
            });
        }
        
        if (report.risks.overall > 0.7) {
            report.recommendations.push({
                priority: 'critical',
                area: 'risk',
                action: 'Conduct comprehensive privacy audit'
            });
        }
        
        return report;
    }

    /**
     * Utility methods
     */
    setupEncryption() {
        // Generate master keys for different purposes
        const purposes = ['storage', 'transmission', 'backup'];
        
        purposes.forEach(purpose => {
            if (!this.encryptionKeys.has(purpose)) {
                const key = crypto.randomBytes(32);
                this.encryptionKeys.set(purpose, key);
            }
        });
    }

    async getEncryptionKey(purpose) {
        const masterKey = this.encryptionKeys.get(purpose);
        
        if (!masterKey) {
            throw new Error(`No encryption key for purpose: ${purpose}`);
        }
        
        // Derive key using PBKDF2
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(
                masterKey,
                'yizhen-privacy-salt',
                this.config.encryption.iterations,
                32,
                'sha256',
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                }
            );
        });
    }

    getPseudonymizationKey() {
        return this.encryptionKeys.get('pseudonymization') || 
               crypto.randomBytes(32);
    }

    initializeDataCategories() {
        this.dataCategories = {
            identity: {
                fields: ['name', 'email', 'phone', 'address'],
                sensitivity: 'high',
                retention: this.config.retention.personalData
            },
            financial: {
                fields: ['walletAddress', 'transactions', 'balances'],
                sensitivity: 'critical',
                retention: this.config.retention.transactionData
            },
            kyc: {
                fields: ['documents', 'verificationStatus', 'kycLevel'],
                sensitivity: 'critical',
                retention: this.config.retention.kycData
            },
            behavioral: {
                fields: ['loginHistory', 'preferences', 'activity'],
                sensitivity: 'medium',
                retention: this.config.retention.marketingData
            },
            technical: {
                fields: ['ipAddress', 'userAgent', 'deviceId'],
                sensitivity: 'low',
                retention: this.config.retention.logData
            }
        };
    }

    categorizeData(data) {
        const categories = [];
        
        for (const [category, config] of Object.entries(this.dataCategories)) {
            if (config.fields.some(field => data.hasOwnProperty(field))) {
                categories.push(category);
            }
        }
        
        return categories;
    }

    getRetentionPeriod(purpose) {
        const purposeRetention = {
            'kyc-verification': this.config.retention.kycData,
            'transaction-processing': this.config.retention.transactionData,
            'account-management': this.config.retention.personalData,
            'marketing': this.config.retention.marketingData,
            'security-monitoring': this.config.retention.logData
        };
        
        return purposeRetention[purpose] || this.config.retention.personalData;
    }

    generateRequestId() {
        return `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateReportId() {
        return `RPT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateConsentId() {
        return `CNS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateWithdrawalId() {
        return `WDR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateAssessmentId() {
        return `PIA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateBreachId() {
        return `BRH-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    generalizeAge(age) {
        if (age < 18) return 'minor';
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        if (age < 65) return '55-64';
        return '65+';
    }

    generalizeLocation(location) {
        // Return only country/region
        return location.country || 'unknown';
    }

    async auditLog(action, data) {
        const logEntry = {
            timestamp: Date.now(),
            action,
            data,
            actor: 'system',
            ip: data.ip || 'system',
            result: 'success'
        };
        
        // In production, this would write to a secure audit log
        console.log(`📝 Audit: ${action}`, logEntry);
    }
}

/**
 * Cookie Consent Manager
 */
class CookieConsentManager {
    constructor() {
        this.consentKey = 'yizhen_cookie_consent';
        this.preferences = this.loadPreferences();
        this.categories = {
            necessary: {
                name: 'Necessary',
                description: 'Essential for website functionality',
                required: true
            },
            analytics: {
                name: 'Analytics',
                description: 'Help us understand how you use our platform',
                required: false
            },
            marketing: {
                name: 'Marketing',
                description: 'Personalized content and advertisements',
                required: false
            },
            preferences: {
                name: 'Preferences',
                description: 'Remember your settings and choices',
                required: false
            }
        };
    }

    showConsentBanner() {
        if (this.hasConsent()) return;
        
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <h3>🍪 Cookie Preferences</h3>
                <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
                
                <div class="cookie-categories">
                    ${Object.entries(this.categories).map(([key, category]) => `
                        <label class="cookie-category">
                            <input type="checkbox" 
                                   name="cookie-${key}" 
                                   value="${key}"
                                   ${category.required ? 'checked disabled' : ''}
                                   ${this.preferences[key] ? 'checked' : ''}>
                            <div>
                                <strong>${category.name}</strong>
                                <small>${category.description}</small>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <div class="cookie-actions">
                    <button onclick="cookieConsent.acceptAll()">Accept All</button>
                    <button onclick="cookieConsent.acceptSelected()">Accept Selected</button>
                    <button onclick="cookieConsent.rejectAll()">Reject All</button>
                </div>
                
                <a href="/privacy-policy" class="cookie-policy-link">Privacy Policy</a>
            </div>
        `;
        
        document.body.appendChild(banner);
        this.addStyles();
    }

    acceptAll() {
        Object.keys(this.categories).forEach(key => {
            this.preferences[key] = true;
        });
        this.savePreferences();
        this.hideBanner();
        this.applyPreferences();
    }

    acceptSelected() {
        const checkboxes = document.querySelectorAll('#cookie-consent-banner input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.disabled) {
                this.preferences[checkbox.value] = checkbox.checked;
            }
        });
        this.savePreferences();
        this.hideBanner();
        this.applyPreferences();
    }

    rejectAll() {
        Object.keys(this.categories).forEach(key => {
            this.preferences[key] = this.categories[key].required;
        });
        this.savePreferences();
        this.hideBanner();
        this.applyPreferences();
    }

    savePreferences() {
        const consent = {
            timestamp: Date.now(),
            preferences: this.preferences,
            version: '1.0'
        };
        localStorage.setItem(this.consentKey, JSON.stringify(consent));
        
        // Also save to backend
        this.syncWithBackend(consent);
    }

    loadPreferences() {
        const stored = localStorage.getItem(this.consentKey);
        if (stored) {
            const consent = JSON.parse(stored);
            return consent.preferences;
        }
        
        // Default: only necessary cookies
        return {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
    }

    hasConsent() {
        return localStorage.getItem(this.consentKey) !== null;
    }

    applyPreferences() {
        // Enable/disable tracking based on preferences
        if (this.preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        if (this.preferences.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }
    }

    enableAnalytics() {
        // Enable Google Analytics, etc.
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    disableAnalytics() {
        // Disable analytics
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

    enableMarketing() {
        // Enable marketing cookies
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'ad_storage': 'granted'
            });
        }
    }

    disableMarketing() {
        // Disable marketing cookies
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'ad_storage': 'denied'
            });
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => banner.remove(), 300);
        }
    }

    async syncWithBackend(consent) {
        try {
            await fetch('/api/privacy/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'cookies',
                    consent
                })
            });
        } catch (error) {
            console.error('Failed to sync consent:', error);
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                z-index: 9999;
                transform: translateY(0);
                transition: transform 0.3s ease;
            }
            
            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .cookie-categories {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .cookie-category {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .cookie-category input {
                margin-top: 2px;
            }
            
            .cookie-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .cookie-actions button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .cookie-actions button:first-child {
                background: #28a745;
                color: white;
            }
            
            .cookie-actions button:nth-child(2) {
                background: #007bff;
                color: white;
            }
            
            .cookie-actions button:last-child {
                background: #dc3545;
                color: white;
            }
            
            .cookie-policy-link {
                display: inline-block;
                margin-top: 10px;
                color: #007bff;
                text-decoration: none;
                font-size: 14px;
            }
            
            @media (max-width: 768px) {
                .cookie-categories {
                    grid-template-columns: 1fr;
                }
                
                .cookie-actions {
                    flex-direction: column;
                }
                
                .cookie-actions button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.privacyManager = new PrivacyComplianceManager();
    window.cookieConsent = new CookieConsentManager();
    
    // Show cookie banner on page load
    document.addEventListener('DOMContentLoaded', () => {
        window.cookieConsent.showConsentBanner();
    });
}

export { PrivacyComplianceManager, CookieConsentManager };
