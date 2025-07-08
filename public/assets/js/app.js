// Simplified app.js without ES6 modules - Works with regular script tag

(function() {
    'use strict';

    // Main Application Class
    class YizhenApp {
        constructor() {
            this.artifacts = window.artifactsData || [];
            this.currentFilter = 'all';
            this.currentSort = 'lot';
            this.selectedArtifact = null;
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
                
                console.log('Yizhen App initialized successfully');
                
            } catch (error) {
                console.error('Error initializing app:', error);
                alert('Failed to initialize application');
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
                    alert('Wallet connection not implemented in demo');
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

        createArtifactCard(artifact) {
            const card = document.createElement('div');
            card.className = 'artifact-card';
            card.dataset.artifactId = artifact.id;
            
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
                    <div class="artifact-lot">LOT ${artifact.lotNumber}</div>
                    <h3 class="artifact-title">${artifact.title}</h3>
                    <p class="artifact-dynasty">${artifact.chinese}<br>${artifact.dynastyInfo}</p>
                    <p class="artifact-estimate">Estimate: $${artifact.estimate.low.toLocaleString()} - $${artifact.estimate.high.toLocaleString()}</p>
                    <p class="artifact-bid">$${artifact.currentBid.toLocaleString()}</p>
                    <p class="artifact-estimate">${artifact.bidCount} bids • ${this.getTimeLeft(artifact.endTime)}</p>
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

            // Update modal info
            const modalInfo = document.getElementById('modal-info');
            if (modalInfo) {
                modalInfo.innerHTML = `
                    <div class="modal-lot-number">LOT ${this.selectedArtifact.lotNumber}</div>
                    <h2 class="modal-title">${this.selectedArtifact.title}</h2>
                    <p class="modal-dynasty">${this.selectedArtifact.chinese} | ${this.selectedArtifact.dynastyInfo}</p>
                    <p class="modal-description">${this.selectedArtifact.description}</p>
                    
                    <div class="detail-sections">
                        <div class="detail-section">
                            <h4>Provenance</h4>
                            <p>${this.selectedArtifact.provenance}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Condition</h4>
                            <p>${this.selectedArtifact.condition}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Dimensions</h4>
                            <p>${this.selectedArtifact.dimensions}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Literature</h4>
                            <p>${this.selectedArtifact.literature}</p>
                        </div>
                    </div>
                    
                    <div class="bidding-section">
                        <div class="current-bid-info">
                            <div class="current-bid-label">Current Bid</div>
                            <div class="current-bid-amount">$${this.selectedArtifact.currentBid.toLocaleString()}</div>
                            <div class="bid-count">${this.selectedArtifact.bidCount} bids</div>
                        </div>
                        
                        <div class="bid-options">
                            <div class="bid-option">
                                <h5>Place Bid for Full Ownership</h5>
                                <p>Acquire complete ownership of this artifact.</p>
                                <div class="bid-input-group">
                                    <input type="number" class="bid-input" id="bid-amount" 
                                           placeholder="Amount in USD" step="1000" 
                                           min="${this.selectedArtifact.currentBid + this.selectedArtifact.minBidIncrement}">
                                    <button class="bid-button" onclick="window.app.placeBid()">Place Bid</button>
                                </div>
                                <p style="font-size: 0.75rem; margin-top: 0.5rem;">
                                    Minimum bid: $${(this.selectedArtifact.currentBid + this.selectedArtifact.minBidIncrement).toLocaleString()}
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
                alert(`Minimum bid is $${minBid.toLocaleString()}`);
                return;
            }

            // Demo mode - just update the values
            this.selectedArtifact.currentBid = bidAmount;
            this.selectedArtifact.bidCount++;
            
            alert(`Bid of $${bidAmount.toLocaleString()} placed successfully!`);
            
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
                totalValueElement.textContent = `$${totalValue.toLocaleString()}`;
            }
        }

        getTimeLeft(endTime) {
            const now = Date.now();
            const diff = endTime - now;
            
            if (diff <= 0) return 'Ended';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (days > 0) return `${days}d ${hours}h`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
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
                        timeElement.textContent = `${artifact.bidCount} bids • ${this.getTimeLeft(artifact.endTime)}`;
                    }
                }
            });
        }
    }

    // Initialize when DOM is ready
    function initializeApp() {
        console.log('DOM Content Loaded - Initializing Yizhen App');
        window.app = new YizhenApp();
        window.app.init();
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
