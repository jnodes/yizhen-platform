// compliance-alerts.js - Real-time alerts and notification system for Yizhen platform

import { EventEmitter } from 'events';

/**
 * Real-time Alert System for Compliance Monitoring
 * Handles alert generation, routing, and notifications
 */
class ComplianceAlertSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Alert channels
            channels: {
                email: config.emailEnabled || true,
                sms: config.smsEnabled || false,
                slack: config.slackEnabled || true,
                webhook: config.webhookEnabled || true,
                dashboard: config.dashboardEnabled || true,
                push: config.pushEnabled || true
            },
            
            // Alert thresholds
            thresholds: {
                criticalRiskScore: config.criticalRiskScore || 0.8,
                highRiskScore: config.highRiskScore || 0.6,
                velocityLimit: config.velocityLimit || 10,
                volumeLimit: config.volumeLimit || 100000,
                suspiciousPatterns: config.suspiciousPatterns || 3
            },
            
            // Notification settings
            notifications: {
                emailServer: config.emailServer || process.env.SMTP_SERVER,
                slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK,
                smsProvider: config.smsProvider || 'twilio',
                pushService: config.pushService || 'firebase'
            },
            
            // Alert rules
            rules: config.rules || this.getDefaultRules(),
            
            // Rate limiting
            rateLimits: {
                perUser: 10, // alerts per hour
                perType: 50, // alerts per type per hour
                global: 1000 // total alerts per hour
            }
        };
        
        this.alerts = new Map();
        this.alertQueue = [];
        this.alertHistory = [];
        this.subscribers = new Map();
        this.rateLimiters = new Map();
        
        this.initialize();
    }

    initialize() {
        // Set up WebSocket for real-time updates
        this.setupWebSocket();
        
        // Initialize notification channels
        this.initializeChannels();
        
        // Start alert processor
        this.startAlertProcessor();
        
        console.log('🚨 Compliance Alert System initialized');
    }

    /**
     * Generate and dispatch an alert
     */
    async generateAlert(alertData) {
        const alert = {
            id: this.generateAlertId(),
            timestamp: Date.now(),
            type: alertData.type,
            severity: alertData.severity,
            category: alertData.category,
            title: alertData.title,
            message: alertData.message,
            data: alertData.data,
            source: alertData.source || 'system',
            status: 'new',
            channels: this.determineChannels(alertData),
            metadata: {
                ...alertData.metadata,
                environment: process.env.NODE_ENV,
                version: '1.0.0'
            }
        };

        // Check rate limits
        if (!this.checkRateLimits(alert)) {
            console.warn('Alert rate limit exceeded:', alert.type);
            return null;
        }

        // Apply alert rules
        const processedAlert = await this.applyRules(alert);
        
        if (!processedAlert.shouldSend) {
            console.log('Alert suppressed by rules:', alert.id);
            return null;
        }

        // Store alert
        this.alerts.set(alert.id, processedAlert);
        this.alertQueue.push(processedAlert);
        
        // Emit event for real-time subscribers
        this.emit('alert', processedAlert);
        
        // Process immediately if critical
        if (processedAlert.severity === 'critical') {
            await this.processAlert(processedAlert);
        }
        
        return processedAlert;
    }

    /**
     * Process alerts from queue
     */
    async startAlertProcessor() {
        setInterval(async () => {
            if (this.alertQueue.length === 0) return;
            
            const batch = this.alertQueue.splice(0, 10); // Process 10 at a time
            
            for (const alert of batch) {
                try {
                    await this.processAlert(alert);
                } catch (error) {
                    console.error('Alert processing failed:', error);
                    alert.status = 'failed';
                    alert.error = error.message;
                }
            }
        }, 1000); // Process every second
    }

    /**
     * Process individual alert
     */
    async processAlert(alert) {
        console.log(`📤 Processing alert ${alert.id}: ${alert.title}`);
        
        // Update status
        alert.status = 'processing';
        alert.processedAt = Date.now();
        
        // Send through each configured channel
        const results = await Promise.allSettled([
            this.config.channels.email && this.sendEmail(alert),
            this.config.channels.sms && this.sendSMS(alert),
            this.config.channels.slack && this.sendSlack(alert),
            this.config.channels.webhook && this.sendWebhook(alert),
            this.config.channels.dashboard && this.updateDashboard(alert),
            this.config.channels.push && this.sendPushNotification(alert)
        ]);
        
        // Update alert with results
        alert.channelResults = results.map((result, index) => ({
            channel: Object.keys(this.config.channels)[index],
            status: result.status,
            error: result.reason
        }));
        
        // Update final status
        const allSuccess = results.every(r => r.status === 'fulfilled');
        alert.status = allSuccess ? 'sent' : 'partial';
        
        // Add to history
        this.alertHistory.push(alert);
        if (this.alertHistory.length > 10000) {
            this.alertHistory.shift(); // Keep last 10k alerts
        }
        
        // Clean up old alerts from memory
        if (this.alerts.size > 1000) {
            const oldestId = this.alerts.keys().next().value;
            this.alerts.delete(oldestId);
        }
        
        return alert;
    }

    /**
     * Send email notification
     */
    async sendEmail(alert) {
        if (!this.emailTransporter) return;
        
        const emailTemplate = this.getEmailTemplate(alert);
        
        const mailOptions = {
            from: 'compliance@yizhen.com',
            to: this.getEmailRecipients(alert),
            subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            html: emailTemplate,
            priority: alert.severity === 'critical' ? 'high' : 'normal'
        };
        
        try {
            await this.emailTransporter.sendMail(mailOptions);
            console.log(`📧 Email sent for alert ${alert.id}`);
        } catch (error) {
            console.error('Email send failed:', error);
            throw error;
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMS(alert) {
        if (!this.smsClient || alert.severity !== 'critical') return;
        
        const message = `YIZHEN ALERT: ${alert.title}\nSeverity: ${alert.severity}\nAction required: ${alert.data.action || 'Review immediately'}`;
        
        const recipients = this.getSMSRecipients(alert);
        
        try {
            await Promise.all(recipients.map(phone => 
                this.smsClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE,
                    to: phone
                })
            ));
            console.log(`📱 SMS sent for alert ${alert.id}`);
        } catch (error) {
            console.error('SMS send failed:', error);
            throw error;
        }
    }

    /**
     * Send Slack notification
     */
    async sendSlack(alert) {
        if (!this.config.notifications.slackWebhook) return;
        
        const slackMessage = {
            text: `${this.getSeverityEmoji(alert.severity)} *${alert.title}*`,
            attachments: [{
                color: this.getSeverityColor(alert.severity),
                fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Category', value: alert.category, short: true },
                    { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true },
                    { title: 'Source', value: alert.source, short: true }
                ],
                text: alert.message,
                footer: 'Yizhen Compliance System',
                ts: Math.floor(alert.timestamp / 1000)
            }],
            channel: this.getSlackChannel(alert)
        };
        
        // Add action buttons for critical alerts
        if (alert.severity === 'critical') {
            slackMessage.attachments[0].actions = [
                {
                    type: 'button',
                    text: 'View Details',
                    url: `https://compliance.yizhen.com/alerts/${alert.id}`
                },
                {
                    type: 'button',
                    text: 'Take Action',
                    url: `https://compliance.yizhen.com/alerts/${alert.id}/action`,
                    style: 'danger'
                }
            ];
        }
        
        try {
            const response = await fetch(this.config.notifications.slackWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slackMessage)
            });
            
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.status}`);
            }
            
            console.log(`💬 Slack notification sent for alert ${alert.id}`);
        } catch (error) {
            console.error('Slack send failed:', error);
            throw error;
        }
    }

    /**
     * Send webhook notification
     */
    async sendWebhook(alert) {
        const webhookSubscribers = this.getWebhookSubscribers(alert);
        
        if (webhookSubscribers.length === 0) return;
        
        const payload = {
            id: `evt_${alert.id}`,
            type: `compliance.alert.${alert.type}`,
            created: alert.timestamp,
            data: {
                alert: {
                    id: alert.id,
                    severity: alert.severity,
                    category: alert.category,
                    title: alert.title,
                    message: alert.message,
                    metadata: alert.metadata
                },
                ...alert.data
            }
        };
        
        const results = await Promise.allSettled(
            webhookSubscribers.map(subscriber => 
                this.sendWebhookRequest(subscriber, payload)
            )
        );
        
        console.log(`🔗 Webhooks sent: ${results.filter(r => r.status === 'fulfilled').length}/${webhookSubscribers.length}`);
    }

    /**
     * Update dashboard with alert
     */
    async updateDashboard(alert) {
        // Send to connected WebSocket clients
        this.broadcast('dashboard-alert', {
            type: 'new-alert',
            alert: {
                id: alert.id,
                timestamp: alert.timestamp,
                severity: alert.severity,
                category: alert.category,
                title: alert.title,
                message: alert.message,
                status: alert.status
            }
        });
        
        // Update dashboard statistics
        this.updateDashboardStats(alert);
        
        console.log(`📊 Dashboard updated for alert ${alert.id}`);
    }

    /**
     * Send push notification
     */
    async sendPushNotification(alert) {
        if (!this.pushService || alert.severity === 'low') return;
        
        const notification = {
            title: `${this.getSeverityEmoji(alert.severity)} ${alert.title}`,
            body: alert.message,
            icon: '/icons/alert-icon.png',
            badge: '/icons/badge-icon.png',
            tag: alert.id,
            data: {
                alertId: alert.id,
                severity: alert.severity,
                url: `https://yizhen.com/alerts/${alert.id}`
            },
            actions: [
                { action: 'view', title: 'View Details' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };
        
        const tokens = await this.getPushTokens(alert);
        
        if (tokens.length === 0) return;
        
        try {
            const response = await this.pushService.sendMulticast({
                tokens,
                notification,
                webpush: {
                    headers: {
                        Urgency: alert.severity === 'critical' ? 'high' : 'normal'
                    }
                }
            });
            
            console.log(`📲 Push notifications sent: ${response.successCount}/${tokens.length}`);
        } catch (error) {
            console.error('Push notification failed:', error);
            throw error;
        }
    }

    /**
     * Alert aggregation and correlation
     */
    async correlateAlerts(timeWindow = 3600000) { // 1 hour
        const recentAlerts = this.alertHistory.filter(
            alert => Date.now() - alert.timestamp < timeWindow
        );
        
        const correlations = {
            byUser: new Map(),
            byType: new Map(),
            byPattern: new Map()
        };
        
        // Group by user
        recentAlerts.forEach(alert => {
            if (alert.data?.walletAddress) {
                const userAlerts = correlations.byUser.get(alert.data.walletAddress) || [];
                userAlerts.push(alert);
                correlations.byUser.set(alert.data.walletAddress, userAlerts);
            }
        });
        
        // Detect patterns
        for (const [user, alerts] of correlations.byUser) {
            if (alerts.length > 5) {
                // Multiple alerts for same user
                await this.generateAlert({
                    type: 'correlated-alerts',
                    severity: 'high',
                    category: 'pattern',
                    title: 'Multiple Alerts Detected',
                    message: `User ${user} has triggered ${alerts.length} alerts in the past hour`,
                    data: {
                        walletAddress: user,
                        alertCount: alerts.length,
                        alertTypes: [...new Set(alerts.map(a => a.type))]
                    }
                });
            }
        }
        
        return correlations;
    }

    /**
     * Alert suppression and deduplication
     */
    shouldSuppressAlert(alert) {
        // Check for duplicate alerts
        const recentSimilar = this.alertHistory.filter(
            a => a.type === alert.type &&
                 a.data?.walletAddress === alert.data?.walletAddress &&
                 Date.now() - a.timestamp < 300000 // 5 minutes
        );
        
        if (recentSimilar.length > 0) {
            console.log(`Suppressing duplicate alert: ${alert.type}`);
            return true;
        }
        
        // Check suppression rules
        const suppressionRule = this.config.rules.find(
            rule => rule.type === 'suppression' && 
                    rule.condition(alert)
        );
        
        return !!suppressionRule;
    }

    /**
     * Get default alert rules
     */
    getDefaultRules() {
        return [
            {
                id: 'critical-risk-escalation',
                type: 'escalation',
                condition: (alert) => alert.data?.riskScore > 0.8,
                action: (alert) => {
                    alert.severity = 'critical';
                    alert.channels.push('sms', 'phone');
                }
            },
            {
                id: 'sanctions-immediate-action',
                type: 'action',
                condition: (alert) => alert.type === 'sanctions-match',
                action: (alert) => {
                    alert.severity = 'critical';
                    alert.data.action = 'block-immediately';
                }
            },
            {
                id: 'high-volume-correlation',
                type: 'correlation',
                condition: (alert) => alert.type === 'high-volume-transaction',
                action: async (alert) => {
                    await this.correlateAlerts(3600000);
                }
            },
            {
                id: 'business-hours-routing',
                type: 'routing',
                condition: (alert) => {
                    const hour = new Date().getHours();
                    return hour < 8 || hour > 18;
                },
                action: (alert) => {
                    alert.channels = ['email', 'slack']; // No SMS after hours
                }
            }
        ];
    }

    /**
     * Apply rules to alert
     */
    async applyRules(alert) {
        const processedAlert = { ...alert, shouldSend: true };
        
        // Check suppression
        if (this.shouldSuppressAlert(processedAlert)) {
            processedAlert.shouldSend = false;
            return processedAlert;
        }
        
        // Apply each matching rule
        for (const rule of this.config.rules) {
            if (rule.condition(processedAlert)) {
                await rule.action(processedAlert);
            }
        }
        
        return processedAlert;
    }

    /**
     * Determine notification channels based on alert
     */
    determineChannels(alert) {
        const channels = [];
        
        // Always use dashboard
        channels.push('dashboard');
        
        // Critical alerts use all channels
        if (alert.severity === 'critical') {
            return Object.keys(this.config.channels).filter(
                channel => this.config.channels[channel]
            );
        }
        
        // High severity
        if (alert.severity === 'high') {
            channels.push('email', 'slack', 'webhook', 'push');
        }
        
        // Medium severity
        if (alert.severity === 'medium') {
            channels.push('email', 'slack', 'webhook');
        }
        
        // Low severity
        if (alert.severity === 'low') {
            channels.push('email', 'webhook');
        }
        
        return channels.filter(channel => this.config.channels[channel]);
    }

    /**
     * Check rate limits
     */
    checkRateLimits(alert) {
        const now = Date.now();
        const hour = 3600000;
        
        // User rate limit
        if (alert.data?.walletAddress) {
            const userKey = `user:${alert.data.walletAddress}`;
            const userAlerts = this.getRateLimitCount(userKey, hour);
            
            if (userAlerts >= this.config.rateLimits.perUser) {
                return false;
            }
        }
        
        // Type rate limit
        const typeKey = `type:${alert.type}`;
        const typeAlerts = this.getRateLimitCount(typeKey, hour);
        
        if (typeAlerts >= this.config.rateLimits.perType) {
            return false;
        }
        
        // Global rate limit
        const globalAlerts = this.getRateLimitCount('global', hour);
        
        if (globalAlerts >= this.config.rateLimits.global) {
            return false;
        }
        
        // Update counters
        this.incrementRateLimit(`user:${alert.data?.walletAddress}`, now);
        this.incrementRateLimit(typeKey, now);
        this.incrementRateLimit('global', now);
        
        return true;
    }

    /**
     * Get rate limit count
     */
    getRateLimitCount(key, window) {
        const limiter = this.rateLimiters.get(key) || [];
        const cutoff = Date.now() - window;
        
        return limiter.filter(timestamp => timestamp > cutoff).length;
    }

    /**
     * Increment rate limit counter
     */
    incrementRateLimit(key, timestamp) {
        const limiter = this.rateLimiters.get(key) || [];
        limiter.push(timestamp);
        
        // Clean old entries
        const cutoff = timestamp - 3600000;
        const cleaned = limiter.filter(ts => ts > cutoff);
        
        this.rateLimiters.set(key, cleaned);
    }

    /**
     * Setup WebSocket for real-time communication
     */
    setupWebSocket() {
        // This would connect to your WebSocket server
        // For now, we'll use a mock implementation
        this.wsClients = new Set();
        
        // Simulate WebSocket server
        this.broadcast = (event, data) => {
            const message = JSON.stringify({ event, data, timestamp: Date.now() });
            this.wsClients.forEach(client => {
                if (client.readyState === 1) { // OPEN
                    client.send(message);
                }
            });
        };
    }

    /**
     * Initialize notification channels
     */
    async initializeChannels() {
        // Email setup
        if (this.config.channels.email) {
            try {
                const nodemailer = await import('nodemailer');
                this.emailTransporter = nodemailer.createTransport({
                    host: this.config.notifications.emailServer,
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
            } catch (error) {
                console.warn('Email transport not available:', error.message);
            }
        }
        
        // SMS setup
        if (this.config.channels.sms) {
            try {
                const twilio = await import('twilio');
                this.smsClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
            } catch (error) {
                console.warn('SMS client not available:', error.message);
            }
        }
        
        // Push notification setup
        if (this.config.channels.push) {
            try {
                const admin = await import('firebase-admin');
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                        })
                    });
                }
                this.pushService = admin.messaging();
            } catch (error) {
                console.warn('Push service not available:', error.message);
            }
        }
    }

    /**
     * Subscribe to alerts
     */
    subscribe(filter, callback) {
        const id = this.generateSubscriptionId();
        this.subscribers.set(id, { filter, callback });
        return id;
    }

    /**
     * Unsubscribe from alerts
     */
    unsubscribe(id) {
        return this.subscribers.delete(id);
    }

    /**
     * Get alert statistics
     */
    getStatistics(timeWindow = 86400000) { // 24 hours
        const cutoff = Date.now() - timeWindow;
        const recentAlerts = this.alertHistory.filter(a => a.timestamp > cutoff);
        
        return {
            total: recentAlerts.length,
            bySeverity: {
                critical: recentAlerts.filter(a => a.severity === 'critical').length,
                high: recentAlerts.filter(a => a.severity === 'high').length,
                medium: recentAlerts.filter(a => a.severity === 'medium').length,
                low: recentAlerts.filter(a => a.severity === 'low').length
            },
            byCategory: recentAlerts.reduce((acc, alert) => {
                acc[alert.category] = (acc[alert.category] || 0) + 1;
                return acc;
            }, {}),
            byStatus: {
                sent: recentAlerts.filter(a => a.status === 'sent').length,
                partial: recentAlerts.filter(a => a.status === 'partial').length,
                failed: recentAlerts.filter(a => a.status === 'failed').length
            },
            averageProcessingTime: this.calculateAverageProcessingTime(recentAlerts),
            topUsers: this.getTopAlertUsers(recentAlerts, 10)
        };
    }

    /**
     * Utility methods
     */
    generateAlertId() {
        return `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSubscriptionId() {
        return `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getSeverityEmoji(severity) {
        const emojis = {
            critical: '🚨',
            high: '⚠️',
            medium: '📢',
            low: 'ℹ️'
        };
        return emojis[severity] || '📌';
    }

    getSeverityColor(severity) {
        const colors = {
            critical: '#dc3545',
            high: '#fd7e14',
            medium: '#ffc107',
            low: '#17a2b8'
        };
        return colors[severity] || '#6c757d';
    }

    getSlackChannel(alert) {
        if (alert.severity === 'critical') return '#compliance-critical';
        if (alert.severity === 'high') return '#compliance-alerts';
        return '#compliance-monitoring';
    }

    getEmailRecipients(alert) {
        const recipients = ['compliance@yizhen.com'];
        
        if (alert.severity === 'critical') {
            recipients.push('ciso@yizhen.com', 'legal@yizhen.com');
        }
        
        if (alert.data?.assignedTo) {
            recipients.push(alert.data.assignedTo);
        }
        
        return recipients.join(',');
    }

    getSMSRecipients(alert) {
        // Only for critical alerts
        if (alert.severity !== 'critical') return [];
        
        return [
            process.env.COMPLIANCE_OFFICER_PHONE,
            process.env.CISO_PHONE
        ].filter(Boolean);
    }

    getWebhookSubscribers(alert) {
        // In production, this would query a database
        return [
            {
                url: 'https://partner1.com/webhooks/compliance',
                secret: 'webhook-secret-1',
                events: ['all']
            },
            {
                url: 'https://partner2.com/webhooks/alerts',
                secret: 'webhook-secret-2',
                events: ['critical', 'high']
            }
        ].filter(sub => 
            sub.events.includes('all') || 
            sub.events.includes(alert.severity)
        );
    }

    async getPushTokens(alert) {
        // In production, this would query user preferences
        return ['mock-push-token-1', 'mock-push-token-2'];
    }

    getEmailTemplate(alert) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
                    .severity-${alert.severity} { color: ${this.getSeverityColor(alert.severity)}; }
                    .content { background: white; padding: 20px; border: 1px solid #dee2e6; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
                    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 class="severity-${alert.severity}">${this.getSeverityEmoji(alert.severity)} ${alert.title}</h2>
                    </div>
                    <div class="content">
                        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
                        <p><strong>Category:</strong> ${alert.category}</p>
                        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                        <hr>
                        <p>${alert.message}</p>
                        ${alert.data ? `
                            <h3>Details:</h3>
                            <pre>${JSON.stringify(alert.data, null, 2)}</pre>
                        ` : ''}
                        <hr>
                        <p>
                            <a href="https://compliance.yizhen.com/alerts/${alert.id}" class="button">
                                View in Dashboard
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Yizhen Compliance System</p>
                        <p>Alert ID: ${alert.id}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendWebhookRequest(subscriber, payload) {
        const signature = this.generateWebhookSignature(payload, subscriber.secret);
        
        const response = await fetch(subscriber.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Yizhen-Signature': signature,
                'X-Yizhen-Event': payload.type,
                'X-Yizhen-Timestamp': payload.created.toString()
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status}`);
        }
        
        return response;
    }

    generateWebhookSignature(payload, secret) {
        const crypto = require('crypto');
        const timestamp = payload.created;
        const message = `${timestamp}.${JSON.stringify(payload)}`;
        
        return crypto
            .createHmac('sha256', secret)
            .update(message)
            .digest('hex');
    }

    updateDashboardStats(alert) {
        const stats = {
            totalAlerts: this.alerts.size,
            criticalAlerts: Array.from(this.alerts.values()).filter(a => a.severity === 'critical').length,
            unresolved: Array.from(this.alerts.values()).filter(a => a.status !== 'resolved').length,
            lastAlert: alert.timestamp
        };
        
        this.broadcast('dashboard-stats', stats);
    }

    calculateAverageProcessingTime(alerts) {
        const processed = alerts.filter(a => a.processedAt);
        if (processed.length === 0) return 0;
        
        const totalTime = processed.reduce((sum, alert) => 
            sum + (alert.processedAt - alert.timestamp), 0
        );
        
        return Math.round(totalTime / processed.length);
    }

    getTopAlertUsers(alerts, limit) {
        const userCounts = {};
        
        alerts.forEach(alert => {
            if (alert.data?.walletAddress) {
                userCounts[alert.data.walletAddress] = (userCounts[alert.data.walletAddress] || 0) + 1;
            }
        });
        
        return Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([user, count]) => ({ user, count }));
    }
}

// Alert Factory for common alert types
class ComplianceAlertFactory {
    static createSanctionsAlert(walletAddress, matchData) {
        return {
            type: 'sanctions-match',
            severity: 'critical',
            category: 'sanctions',
            title: 'Sanctions List Match Detected',
            message: `Wallet ${walletAddress} matched against ${matchData.list} sanctions list`,
            data: {
                walletAddress,
                sanctionsList: matchData.list,
                matchType: matchData.matchType,
                confidence: matchData.confidence,
                action: 'block-immediately'
            }
        };
    }

    static createHighRiskAlert(walletAddress, riskData) {
        return {
            type: 'high-risk-transaction',
            severity: riskData.score > 0.8 ? 'critical' : 'high',
            category: 'risk',
            title: 'High Risk Transaction Detected',
            message: `Transaction from ${walletAddress} exceeds risk threshold`,
            data: {
                walletAddress,
                riskScore: riskData.score,
                riskFactors: riskData.factors,
                transactionId: riskData.transactionId,
                action: 'manual-review'
            }
        };
    }

    static createKYCExpiryAlert(walletAddress, expiryData) {
        return {
            type: 'kyc-expiry',
            severity: 'medium',
            category: 'kyc',
            title: 'KYC Verification Expiring',
            message: `KYC for ${walletAddress} expires in ${expiryData.daysRemaining} days`,
            data: {
                walletAddress,
                expiryDate: expiryData.expiryDate,
                daysRemaining: expiryData.daysRemaining,
                action: 'send-renewal-reminder'
            }
        };
    }

    static createVelocityAlert(walletAddress, velocityData) {
        return {
            type: 'velocity-limit-exceeded',
            severity: 'high',
            category: 'monitoring',
            title: 'Transaction Velocity Limit Exceeded',
            message: `Wallet ${walletAddress} exceeded velocity limits`,
            data: {
                walletAddress,
                transactionCount: velocityData.count,
                timeWindow: velocityData.window,
                limit: velocityData.limit,
                action: 'temporary-restriction'
            }
        };
    }

    static createPatternAlert(walletAddress, patternData) {
        return {
            type: 'suspicious-pattern',
            severity: patternData.patterns.length > 3 ? 'high' : 'medium',
            category: 'pattern',
            title: 'Suspicious Transaction Pattern Detected',
            message: `Multiple suspicious patterns detected for ${walletAddress}`,
            data: {
                walletAddress,
                patterns: patternData.patterns,
                confidence: patternData.confidence,
                transactions: patternData.transactionIds,
                action: 'enhanced-monitoring'
            }
        };
    }

    static createSystemAlert(alertData) {
        return {
            type: 'system-alert',
            severity: alertData.severity || 'low',
            category: 'system',
            title: alertData.title,
            message: alertData.message,
            data: alertData.data || {}
        };
    }
}

// Export for use in other modules
export { ComplianceAlertSystem, ComplianceAlertFactory };
