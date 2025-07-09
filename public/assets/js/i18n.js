// Complete International Translation System for Yizhen Platform
// Supports English and Traditional Chinese

class I18nManager {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.translations = {
            en: {
                // Navigation
                nav: {
                    auctions: "Auctions",
                    privateSales: "Private Sales",
                    exhibitions: "Exhibitions",
                    about: "About",
                    connectWallet: "Connect Wallet",
                    language: "Language"
                },
                
                // Hero Section
                hero: {
                    title: "Exceptional Chinese Art",
                    subtitle: "Song, Yuan & Ming Dynasty Masterpieces",
                    cta: "View Current Auctions",
                    tagline: "Where Heritage Meets Innovation"
                },
                
                // Auction Section
                auction: {
                    featuredLots: "Featured Lots",
                    totalLots: "Total Lots",
                    activeBids: "Active Bids",
                    totalValue: "Total Value (USD)",
                    allDynasties: "All Dynasties",
                    songDynasty: "Song Dynasty",
                    yuanDynasty: "Yuan Dynasty",
                    mingDynasty: "Ming Dynasty",
                    sortBy: "Sort by:",
                    lotNumber: "Lot Number",
                    priceHighToLow: "Price: High to Low",
                    priceLowToHigh: "Price: Low to High",
                    endingSoon: "Ending Soon",
                    estimate: "Estimate",
                    currentBid: "Current Bid",
                    bids: "bids",
                    ended: "Ended"
                },
                
                // Modal
                modal: {
                    lot: "LOT",
                    provenance: "Provenance",
                    condition: "Condition",
                    dimensions: "Dimensions",
                    literature: "Literature",
                    currentBid: "Current Bid",
                    placeBidTitle: "Place Bid for Full Ownership",
                    placeBidDesc: "Acquire complete ownership of this artifact.",
                    placeBidButton: "Place Bid",
                    minimumBid: "Minimum bid",
                    amountPlaceholder: "Amount in USD",
                    bidSuccess: "Bid placed successfully!",
                    bidError: "Failed to place bid"
                },
                
                // Time
                time: {
                    days: "d",
                    hours: "h",
                    minutes: "m",
                    ended: "Ended"
                },
                
                // Messages
                messages: {
                    walletConnected: "Wallet connected successfully!",
                    walletDisconnected: "Wallet disconnected",
                    accountChanged: "Account changed",
                    connectionCancelled: "Connection cancelled",
                    unlockMetaMask: "Please unlock MetaMask",
                    connectionFailed: "Failed to connect wallet",
                    connectionRestored: "Connection restored",
                    connectionLost: "Connection lost - some features may be limited",
                    demoMode: "Running in Demo Mode - Connect wallet and deploy contracts for real transactions",
                    installMetaMask: "MetaMask is required to use this dApp. Would you like to install it?",
                    networkSwitchFailed: "Failed to switch network",
                    networkAddFailed: "Failed to add network",
                    minimumBidError: "Minimum bid is",
                    transactionFailed: "Transaction failed",
                    loading: "Loading...",
                    noArtifacts: "No artifacts found"
                },
                
                // Errors
                errors: {
                    connectionFailed: "Connection failed",
                    loadingFailed: "Failed to load content",
                    networkError: "Network error",
                    invalidInput: "Invalid input",
                    unauthorized: "Unauthorized access",
                    serviceUnavailable: "Service temporarily unavailable"
                },
                
                // Footer
                footer: {
                    allRightsReserved: "All rights reserved.",
                    web3AuctionHouse: "Web3 Auction House"
                },
                
                // Offline
                offline: {
                    title: "You're Offline",
                    message: "It looks like you've lost your internet connection. Some content may not be available while offline.",
                    tryAgain: "Try Again",
                    imageUnavailable: "Image Unavailable"
                }
            },
            
            zh: {
                // Navigation
                nav: {
                    auctions: "拍賣",
                    privateSales: "私人洽購",
                    exhibitions: "展覽",
                    about: "關於我們",
                    connectWallet: "連接錢包",
                    language: "語言"
                },
                
                // Hero Section
                hero: {
                    title: "中華藝術瑰寶",
                    subtitle: "宋、元、明朝代經典傑作",
                    cta: "瀏覽當前拍賣",
                    tagline: "傳承與創新的交匯點"
                },
                
                // Auction Section
                auction: {
                    featuredLots: "精選拍品",
                    totalLots: "拍品總數",
                    activeBids: "活躍競標",
                    totalValue: "總價值（美元）",
                    allDynasties: "所有朝代",
                    songDynasty: "宋朝",
                    yuanDynasty: "元朝",
                    mingDynasty: "明朝",
                    sortBy: "排序方式：",
                    lotNumber: "拍品編號",
                    priceHighToLow: "價格：高至低",
                    priceLowToHigh: "價格：低至高",
                    endingSoon: "即將結束",
                    estimate: "估價",
                    currentBid: "目前出價",
                    bids: "次競標",
                    ended: "已結束"
                },
                
                // Modal
                modal: {
                    lot: "拍品",
                    provenance: "來源",
                    condition: "狀況",
                    dimensions: "尺寸",
                    literature: "文獻",
                    currentBid: "目前出價",
                    placeBidTitle: "競標完整所有權",
                    placeBidDesc: "獲得此藝術品的完整所有權。",
                    placeBidButton: "出價",
                    minimumBid: "最低出價",
                    amountPlaceholder: "金額（美元）",
                    bidSuccess: "出價成功！",
                    bidError: "出價失敗"
                },
                
                // Time
                time: {
                    days: "天",
                    hours: "小時",
                    minutes: "分鐘",
                    ended: "已結束"
                },
                
                // Messages
                messages: {
                    walletConnected: "錢包連接成功！",
                    walletDisconnected: "錢包已斷開",
                    accountChanged: "帳戶已更改",
                    connectionCancelled: "連接已取消",
                    unlockMetaMask: "請解鎖 MetaMask",
                    connectionFailed: "錢包連接失敗",
                    connectionRestored: "連接已恢復",
                    connectionLost: "連接中斷 - 某些功能可能受限",
                    demoMode: "運行在演示模式 - 連接錢包並部署合約以進行真實交易",
                    installMetaMask: "使用此 dApp 需要 MetaMask。您想要安裝它嗎？",
                    networkSwitchFailed: "網絡切換失敗",
                    networkAddFailed: "網絡添加失敗",
                    minimumBidError: "最低出價為",
                    transactionFailed: "交易失敗",
                    loading: "載入中...",
                    noArtifacts: "未找到藝術品"
                },
                
                // Errors
                errors: {
                    connectionFailed: "連接失敗",
                    loadingFailed: "載入內容失敗",
                    networkError: "網絡錯誤",
                    invalidInput: "無效輸入",
                    unauthorized: "未授權存取",
                    serviceUnavailable: "服務暫時不可用"
                },
                
                // Footer
                footer: {
                    allRightsReserved: "版權所有。",
                    web3AuctionHouse: "Web3 拍賣行"
                },
                
                // Offline
                offline: {
                    title: "您已離線",
                    message: "看起來您失去了網絡連接。離線時某些內容可能無法使用。",
                    tryAgain: "重試",
                    imageUnavailable: "圖像無法顯示"
                }
            }
        };
        
        this.initializeLanguage();
    }
    
    detectLanguage() {
        // Check localStorage first
        const stored = localStorage.getItem('yizhen_language');
        if (stored && ['en', 'zh'].includes(stored)) {
            return stored;
        }
        
        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            return 'zh';
        }
        
        // Default to English
        return 'en';
    }
    
    initializeLanguage() {
        document.documentElement.lang = this.currentLanguage === 'zh' ? 'zh-TW' : 'en';
        this.translatePage();
    }
    
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('yizhen_language', lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
        this.translatePage();
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    t(key, interpolations = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            value = value?.[k];
        }
        
        if (typeof value !== 'string') {
            // Fallback to English if translation missing
            value = this.translations.en;
            for (const k of keys) {
                value = value?.[k];
            }
        }
        
        if (typeof value !== 'string') {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }
        
        // Handle interpolations
        Object.keys(interpolations).forEach(placeholder => {
            value = value.replace(`{{${placeholder}}}`, interpolations[placeholder]);
        });
        
        return value;
    }
    
    translatePage() {
        // Translate all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Translate elements with data-i18n-html attribute (for HTML content)
        const htmlElements = document.querySelectorAll('[data-i18n-html]');
        htmlElements.forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.t(key);
            element.innerHTML = translation;
        });
        
        // Translate title and meta descriptions
        document.title = this.t('hero.title') + ' | Yizhen 艺珍';
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = this.currentLanguage === 'zh' 
                ? 'Yizhen 艺珍 - 傳承與創新的交匯點。經認證的中國陶瓷拍賣平台。'
                : 'Yizhen 艺珍 - Where Heritage Meets Innovation. Authenticated Chinese ceramics auction platform.';
        }
    }
    
    // Format numbers according to locale
    formatNumber(number) {
        return new Intl.NumberFormat(this.currentLanguage === 'zh' ? 'zh-TW' : 'en-US').format(number);
    }
    
    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat(this.currentLanguage === 'zh' ? 'zh-TW' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat(this.currentLanguage === 'zh' ? 'zh-TW' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
    
    // Format time remaining
    formatTimeRemaining(endTime) {
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) return this.t('time.ended');
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}${this.t('time.days')} ${hours}${this.t('time.hours')}`;
        if (hours > 0) return `${hours}${this.t('time.hours')} ${minutes}${this.t('time.minutes')}`;
        return `${minutes}${this.t('time.minutes')}`;
    }
}

// Initialize global i18n instance
window.i18n = new I18nManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nManager;
}
