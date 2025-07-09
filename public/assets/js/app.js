// Complete app.js with i18n support - Works with regular script tag

(function() {
    'use strict';

    // Main Application Class
    class YizhenApp {
        constructor() {
            this.artifacts = window.artifactsData || [];
            this.currentFilter = 'all';
            this.currentSort = 'lot';
            this.selectedArtifact = null;
            this.i18n = window.i18n;
            this.currentLanguage = this.i18n ? this.i18n.getCurrentLanguage() : 'en';
        }

        async init() {
            try {
                console.log('Initializing Yizhen App...');
                
                // Initialize core functionality
                this.bindEvents();
                this.hideLoading();
                
                // Try to load artifacts from JSON, fallback to window.artifactsData
                await this.loadArtifacts();
                
                // Initialize UI components
                this.renderArtifacts();
                this.updateStats();
                this.startTimers();
                
                // Set up language change listener
                this.setupLanguageChangeListener();
                
                console.log('Yizhen App initialized successfully');
                
            } catch (error) {
                console.error('Error initializing app:', error);
                this.showToast(this.t('errors.loadingFailed'), 'error');
            }
        }

        // Translation helper
        t(key, interpolations = {}) {
            return this.i18n ? this.i18n.t(key, interpolations) : key;
        }

        // Format currency with i18n
        formatCurrency(amount) {
            return this.i18n ? this.i18n.formatCurrency(amount) : `$${amount.toLocaleString()}`;
        }

        // Format time with i18n
        formatTimeRemaining(endTime) {
            return this.i18n ? this.i18n.formatTimeRemaining(endTime) : this.getTimeLeft(endTime);
        }

        setupLanguageChangeListener() {
            window.addEventListener('languageChanged', (e) => {
                this.currentLanguage = e.detail;
                this.onLanguageChange(e.detail);
            });
        }

        onLanguageChange(lang) {
            this.currentLanguage = lang;
            
            // Re-render artifacts with new language
            this.renderArtifacts();
            this.updateStats();
            
            // Update modal if open
            if (this.selectedArtifact) {
                this.populateModal();
            }
            
            // Update select options
            this.updateSelectOptions();
        }

        updateSelectOptions() {
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                const options = sortSelect.querySelectorAll('option');
                options[0].textContent = this.t('auction.lotNumber');
                options[1].textContent = this.t('auction.priceHighToLow');
                options[2].textContent = this.t('auction.priceLowToHigh');
                options[3].textContent = this.t('auction.endingSoon');
            }
        }

        async loadArtifacts() {
            try {
                const response = await fetch('/assets/data/artifacts.json');
                if (response.ok) {
                    this.artifacts = await response.json();
                    console.log(`Loaded ${this.artifacts.length} artifacts from JSON`);
                } else {
                    throw new Error('Failed to load artifacts.json');
                }
            } catch (error) {
                console.log('Using embedded artifacts data');
                // artifacts already set from window.artifactsData in constructor
            }
        }

        bindEvents() {
            // Wallet connection
            const connectBtn = document.getElementById('connect-wallet-btn');
            if (connectBtn) {
                connectBtn.addEventListener('click', () => {
                    this.showToast(this.t('messages.demoMode'), 'info');
                });
            }

            // Dynasty filters
            document.querySelectorAll('.dynasty-filter').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.filterByDynasty(e.target.dataset.filter);
                });
            });

            // Sort dropdown
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.sortArtifacts(e.target.value);
                });
            }

            // Modal close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.selectedArtifact) {
                    this.closeModal();
                }
            });

            // Modal backdrop click
            const modal = document.getElementById('artifact-modal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === 'artifact-modal') {
                        this.closeModal();
                    }
                });
            }
        }

        hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.classList.add('hidden');
                setTimeout(() => loading.remove(), 300);
            }
        }

        getArtifactTitle(artifact) {
            return this.currentLanguage === 'zh' && artifact.titleZh ? artifact.titleZh : artifact.title;
        }

        getArtifactDescription(artifact) {
            return this.currentLanguage === 'zh' && artifact.descriptionZh ? artifact.descriptionZh : artifact.description;
        }

        getArtifactDynastyInfo(artifact) {
            return this.currentLanguage === 'zh' && artifact.dynastyInfoZh ? artifact.dynastyInfoZh : artifact.dynastyInfo;
        }

        getArtifactField(artifact, field) {
            const zhField = field + 'Zh';
            return this.currentLanguage === 'zh' && artifact[zhField] ? artifact[zhField] : artifact[field];
        }

        createArtifactCard(artifact) {
            const card = document.createElement('div');
            card.className = 'artifact-card';
            card.dataset.artifactId = artifact.id;
            
            const title = this.getArtifactTitle(artifact);
            const dynastyInfo = this.getArtifactDynastyInfo(artifact);
            const estimate = `${this.t('auction.estimate')}: ${this.formatCurrency(artifact.estimate.low)} - ${this.formatCurrency(artifact.estimate.high)}`;
            const currentBid = this.formatCurrency(artifact.currentBid);
            const bidsAndTime = `${artifact.bidCount} ${this.t('auction.bids')} • ${this.formatTimeRemaining(artifact.endTime)}`;
            
            card.innerHTML = `
                <div class="artifact-video-container ${artifact.videoOrientation || 'square'}">
                    <video 
                        class="artifact-video" 
                        muted 
                        loop
                        playsinline
                        preload="none">
                        <source src="${artifact.video}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="artifact-info">
                    <div class="artifact-lot">${this.t('modal.lot')} ${artifact.lotNumber}</div>
                    <h3 class="artifact-title">${title}</h3>
                    <p class="artifact-dynasty">${artifact.chinese}<br>${dynastyInfo}</p>
                    <p class="artifact-estimate">${estimate}</p>
                    <p class="artifact-bid">${currentBid}</p>
                    <p class="artifact-estimate">${bidsAndTime}</p>
                </div>
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                this.openArtifactModal(artifact.id);
            });
            
            // Setup video hover effects
            const video = card.querySelector('video');
            if (video) {
                // Use error handler to gracefully handle missing videos
                video.addEventListener('error', () => {
                    video.style.display = 'none';
                    video.parentElement.style.background = '#f0f0f0';
                });
                
                // Lazy load video when card is visible
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.setAttribute('preload', 'metadata');
                            video.load();
                            observer.unobserve(video);
                        }
                    });
                }, { rootMargin: '100px' });
                
                observer.observe(video);
                
                // Hover play
                card.addEventListener('mouseenter', () => {
                    video.play().catch(() => {});
                });
                
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            }
            
            return card;
        }

        renderArtifacts() {
            const grid = document.getElementById('artifacts-grid');
            if (!grid) {
                console.error('Artifacts grid element not found');
                return;
            }

            // Clear existing content
            grid.innerHTML = '';

            let filteredArtifacts = [...this.artifacts];
            
            // Apply filter
            if (this.currentFilter !== 'all') {
                filteredArtifacts = filteredArtifacts.filter(a => a.dynasty === this.currentFilter);
            }
            
            // Apply sort
            filteredArtifacts.sort((a, b) => {
                switch(this.currentSort) {
                    case 'price-high':
                        return b.currentBid - a.currentBid;
                    case 'price-low':
                        return a.currentBid - b.currentBid;
                    case 'ending':
                        return a.endTime - b.endTime;
                    default:
                        return a.lotNumber.localeCompare(b.lotNumber);
                }
            });
            
            // Create and append cards
            filteredArtifacts.forEach(artifact => {
                const card = this.createArtifactCard(artifact);
                grid.appendChild(card);
            });
            
            console.log(`Rendered ${filteredArtifacts.length} artifact cards`);
        }

        filterByDynasty(dynasty) {
            this.currentFilter = dynasty;
            
            // Update active filter UI
            document.querySelectorAll('.dynasty-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-filter="${dynasty}"]`).classList.add('active');
            
            this.renderArtifacts();
        }

        sortArtifacts(sortBy) {
            this.currentSort = sortBy;
            this.renderArtifacts();
        }

        openArtifactModal(id) {
            this.selectedArtifact = this.artifacts.find(a => a.id === id);
            if (!this.selectedArtifact) return;
            
            this.populateModal();
            this.showModal();
        }

        populateModal() {
            if (!this.selectedArtifact) return;

            // Update video
            const modalVideo = document.getElementById('modal-video');
            if (modalVideo) {
                modalVideo.src = this.selectedArtifact.video;
                modalVideo.load();
            }

            const artifact = this.selectedArtifact;
            const title = this.getArtifactTitle(artifact);
            const description = this.getArtifactDescription(artifact);
            const dynastyInfo = this.getArtifactDynastyInfo(artifact);
            const provenance = this.getArtifactField(artifact, 'provenance');
            const condition = this.getArtifactField(artifact, 'condition');
            const dimensions = this.getArtifactField(artifact, 'dimensions');
            const literature = this.getArtifactField(artifact, 'literature');

            // Update modal info
            const modalInfo = document.getElementById('modal-info');
            if (modalInfo) {
                modalInfo.innerHTML = `
                    <div class="modal-lot-number">${this.t('modal.lot')} ${artifact.lotNumber}</div>
                    <h2 class="modal-title">${title}</h2>
                    <p class="modal-dynasty">${artifact.chinese} | ${dynastyInfo}</p>
                    <p class="modal-description">${description}</p>
                    
                    <div class="detail-sections">
                        <div class="detail-section">
                            <h4>${this.t('modal.provenance')}</h4>
                            <p>${provenance}</p>
                        </div>
                        <div class="detail-section">
                            <h4>${this.t('modal.condition')}</h4>
                            <p>${condition}</p>
                        </div>
                        <div class="detail-section">
                            <h4>${this.t('modal.dimensions')}</h4>
                            <p>${dimensions}</p>
                        </div>
                        <div class="detail-section">
                            <h4>${this.t('modal.literature')}</h4>
                            <p>${literature}</p>
                        </div>
                    </div>
                    
                    <div class="bidding-section">
                        <div class="current-bid-info">
                            <div class="current-bid-label">${this.t('modal.currentBid')}</div>
                            <div class="current-bid-amount">${this.formatCurrency(artifact.currentBid)}</div>
                            <div class="bid-count">${artifact.bidCount} ${this.t('auction.bids')}</div>
                        </div>
                        
                        <div class="bid-options">
                            <div class="bid-option">
                                <h5>${this.t('modal.placeBidTitle')}</h5>
                                <p>${this.t('modal.placeBidDesc')}</p>
                                <div class="bid-input-group">
                                    <input type="number" class="bid-input" id="bid-amount" 
                                           placeholder="${this.t('modal.amountPlaceholder')}" step="1000" 
                                           min="${artifact.currentBid + artifact.minBidIncrement}">
                                    <button class="bid-button" onclick="window.app.placeBid()">${this.t('modal.placeBidButton')}</button>
                                </div>
                                <p style="font-size: 0.75rem; margin-top: 0.5rem;">
                                    ${this.t('modal.minimumBid')}: ${this.formatCurrency(artifact.currentBid + artifact.minBidIncrement)}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        showModal() {
            const modal = document.getElementById('artifact-modal');
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }

        closeModal() {
            const modal = document.getElementById('artifact-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            this.selectedArtifact = null;
        }

        placeBid() {
            const bidInput = document.getElementById('bid-amount');
            if (!bidInput) return;

            const bidAmount = parseFloat(bidInput.value);
            const minBid = this.selectedArtifact.currentBid + this.selectedArtifact.minBidIncrement;
            
            if (isNaN(bidAmount) || bidAmount < minBid) {
                this.showToast(`${this.t('modal.minimumBid')} ${this.formatCurrency(minBid)}`, 'error');
                return;
            }

            // Demo mode - just update the values
            this.selectedArtifact.currentBid = bidAmount;
            this.selectedArtifact.bidCount++;
            
            this.showToast(`${this.t('modal.bidSuccess')} ${this.formatCurrency(bidAmount)}`, 'success');
            
            // Update displays
            this.populateModal();
            this.renderArtifacts();
            this.updateStats();
        }

        updateStats() {
            const totalLotsElement = document.getElementById('total-lots');
            const totalBidsElement = document.getElementById('total-bids');
            const totalValueElement = document.getElementById('total-value');

            if (totalLotsElement) {
                totalLotsElement.textContent = this.artifacts.length;
            }

            if (totalBidsElement) {
                const totalBids = this.artifacts.reduce((sum, a) => sum + a.bidCount, 0);
                totalBidsElement.textContent = totalBids;
            }

            if (totalValueElement) {
                const totalValue = this.artifacts.reduce((sum, a) => sum + a.currentBid, 0);
                totalValueElement.textContent = this.formatCurrency(totalValue);
            }
        }

        getTimeLeft(endTime) {
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

        startTimers() {
            // Update time displays every minute
            setInterval(() => {
                this.updateTimeDisplays();
            }, 60000);
        }

        updateTimeDisplays() {
            const cards = document.querySelectorAll('.artifact-card');
            cards.forEach((card) => {
                const artifactId = parseInt(card.dataset.artifactId);
                const artifact = this.artifacts.find(a => a.id === artifactId);
                
                if (artifact) {
                    const timeElement = card.querySelector('.artifact-estimate:last-of-type');
                    if (timeElement) {
                        timeElement.textContent = `${artifact.bidCount} ${this.t('auction.bids')} • ${this.formatTimeRemaining(artifact.endTime)}`;
                    }
                }
            });
        }

        showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            if (!toast) return;

            toast.textContent = message;
            toast.className = `toast ${type} show`;

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }

    // Initialize when DOM is ready
    function initializeApp() {
        console.log('DOM Content Loaded - Initializing Yizhen App');
        
        // Wait for i18n to be ready
        const waitForI18n = () => {
            if (window.i18n) {
                window.app = new YizhenApp();
                window.app.init();
            } else {
                setTimeout(waitForI18n, 100);
            }
        };
        
        waitForI18n();
    }

    // Global functions for HTML onclick handlers
    window.scrollToTop = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.scrollToAuctions = function() {
        const element = document.getElementById('auctions');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    window.toggleMobileMenu = function() {
        console.log('Mobile menu toggle');
    };

    window.closeModal = function() {
        if (window.app) window.app.closeModal();
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();
