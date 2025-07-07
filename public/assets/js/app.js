// Main Application Module
import { Web3Manager } from './web3.js';
import { LazyLoader } from './lazy-loader.js';
import { UIManager } from './ui-manager.js';

class YizhenApp {
    constructor() {
        this.artifacts = [];
        this.currentFilter = 'all';
        this.currentSort = 'lot';
        this.selectedArtifact = null;
        this.web3Manager = new Web3Manager();
        this.lazyLoader = new LazyLoader();
        this.uiManager = new UIManager();
    }

    async init() {
        try {
            // Initialize core functionality
            this.bindEvents();
            this.hideLoading();
            
            // Load artifacts data asynchronously
            await this.loadArtifacts();
            
            // Initialize UI components
            this.renderArtifacts();
            this.updateStats();
            this.startTimers();
            
            // Initialize Web3 if available
            await this.web3Manager.init();
            
            // Initialize lazy loading
            this.lazyLoader.init();
            
            console.log('Yizhen App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.uiManager.showToast('Failed to initialize application', 'error');
        }
    }

    async loadArtifacts() {
        try {
            const response = await fetch('/assets/data/artifacts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.artifacts = await response.json();
        } catch (error) {
            console.error('Error loading artifacts:', error);
            // Fallback to embedded data if external loading fails
            this.artifacts = this.getFallbackArtifacts();
        }
    }

    getFallbackArtifacts() {
        // Fallback artifact data for when external loading fails
        return [
            {
                id: 1,
                lotNumber: '001',
                title: 'NORTHERN SONG DYNASTY JUN WARE WASHER (OFFICIAL KILN)',
                chinese: '北宋 钧窑洗',
                dynasty: 'song',
                dynastyInfo: 'Northern Song Dynasty, 960-1127 AD',
                videoOrientation: 'landscape',
                video: '/assets/videos/relics/001-jun-washer/main.mp4',
                poster: '/assets/images/posters/001-poster.jpg',
                description: 'This refined ceramic washer—used likely in scholarly or calligraphic rituals—epitomizes the artistry of Jun ware from the Northern Song official kilns.',
                estimate: { low: 80000, high: 120000 },
                currentBid: 92000,
                minBidIncrement: 2000,
                bidCount: 23,
                endTime: Date.now() + 86400000 * 5,
                provenance: 'Private Collection, acquired 1980s\nThermoluminescence tested\nPublished in Jun Ware Studies, 2019',
                condition: 'Excellent condition with characteristic ice-crackle throughout the glaze.',
                dimensions: 'Diameter: Approx. 20 cm (7.9 in)\nHeight: Approx. 10 cm (3.9 in)',
                literature: 'Compare with similar examples in the Palace Museum collections.'
            },
            {
                id: 2,
                lotNumber: '002',
                title: 'NORTHERN SONG DYNASTY JUN KILN LYING-FOOT PLATE',
                chinese: '北宋 钧窑卧足盘',
                dynasty: 'song',
                dynastyInfo: 'Northern Song Dynasty, 960-1127 AD',
                videoOrientation: 'square',
                video: '/assets/videos/relics/002-jun-plate/main.mp4',
                poster: '/assets/images/posters/002-poster.jpg',
                description: 'This refined ceramic piece is a lying-foot plate from the prestigious Jun kilns.',
                estimate: { low: 20000, high: 30000 },
                currentBid: 24000,
                minBidIncrement: 1000,
                bidCount: 15,
                endTime: Date.now() + 86400000 * 7,
                provenance: 'European private collection, acquired 1970s',
                condition: 'Very good condition with high gloss surface.',
                dimensions: 'Diameter: Approx. 22–25 cm (8.7–9.8 in)',
                literature: 'Referenced in "Song Dynasty Ceramics", London, 2015.'
            }
            // Add more fallback artifacts as needed
        ];
    }

    bindEvents() {
        // Wallet connection
        document.getElementById('connect-wallet-btn').addEventListener('click', () => {
            this.web3Manager.connectWallet();
        });

        // Dynasty filters
        document.querySelectorAll('.dynasty-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                this.filterByDynasty(e.target.dataset.filter);
            });
        });

        // Sort dropdown
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortArtifacts(e.target.value);
        });

        // Modal close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.selectedArtifact) {
                this.closeModal();
            }
        });

        // Modal backdrop click
        document.getElementById('artifact-modal').addEventListener('click', (e) => {
            if (e.target.id === 'artifact-modal') {
                this.closeModal();
            }
        });

        // Scroll to top
        document.querySelector('.logo').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Scroll to auctions
        document.querySelector('.hero-cta').addEventListener('click', () => {
            document.getElementById('auctions').scrollIntoView({ behavior: 'smooth' });
        });

        // Handle resize events with debouncing
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.renderArtifacts();
            }, 250);
        });
    }

    hideLoading() {
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.classList.add('hidden');
                // Remove from DOM after animation
                setTimeout(() => loading.remove(), 300);
            }
        }, 500);
    }

    renderArtifacts() {
        const grid = document.getElementById('artifacts-grid');
        if (!grid) return;

        let filteredArtifacts = this.artifacts;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filteredArtifacts = this.artifacts.filter(a => a.dynasty === this.currentFilter);
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
        
        grid.innerHTML = filteredArtifacts.map(artifact => this.createArtifactCard(artifact)).join('');
        
        // Initialize lazy loading for new cards
        this.lazyLoader.observe();
        
        // Add click handlers
        this.bindArtifactCardEvents();
    }

    // Updated app.js - Video-First Homepage Display
// Add this to your existing app.js file or replace the createArtifactCard function

createArtifactCard(artifact) {
    const videoSrc = artifact.video || '/assets/videos/placeholder.mp4';
    
    return `
        <div class="artifact-card" data-artifact-id="${artifact.id}">
            <div class="artifact-video-container ${artifact.videoOrientation || 'square'}">
                <video 
                    src="${videoSrc}" 
                    class="artifact-video" 
                    muted 
                    loop
                    playsinline
                    preload="metadata"
                    onloadeddata="this.play().catch(e => console.log('Autoplay prevented'))"
                    onmouseover="this.play().catch(e => {})"
                    onmouseout="this.pause()"
                    style="width: 100%; height: auto; display: block; background: #f8f8f8;">
                    <source src="${videoSrc}" type="video/mp4">
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
        </div>
    `;
}

// Enhanced video loading for main grid
observeVideos() {
    const videoObserver = this.observers.get('video');
    if (!videoObserver) return;

    // Observe all videos in the grid
    const gridVideos = document.querySelectorAll('.artifacts-grid video');
    gridVideos.forEach(video => {
        videoObserver.observe(video);
        
        // Enhanced video loading
        video.addEventListener('loadeddata', () => {
            // Try to play when loaded
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay was prevented, that's okay
                    console.log('Video autoplay prevented, will play on hover');
                });
            }
        });
        
        // Pause video when out of viewport
        video.addEventListener('pause', () => {
            video.currentTime = 0; // Reset to beginning
        });
    });
}

// Enhanced lazy video loading
loadVideo(video) {
    if (this.loadedVideos.has(video)) return;

    const videoSrc = video.dataset.src || video.src;
    if (!videoSrc) return;

    console.log('Loading video:', videoSrc);
    
    // Set video properties for grid display
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Load the video
    if (video.src !== videoSrc) {
        video.src = videoSrc;
    }
    
    video.addEventListener('loadeddata', () => {
        console.log('Video loaded:', videoSrc);
        video.classList.remove('lazy');
        video.classList.add('loaded');
        
        // Try to start playing
        this.attemptVideoPlay(video);
        
        this.loadedVideos.add(video);
    });

    video.addEventListener('error', () => {
        console.error('Failed to load video:', videoSrc);
        this.handleVideoError(video);
    });
}

// Smart video play attempt
attemptVideoPlay(video) {
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('Video playing successfully');
        }).catch(error => {
            console.log('Autoplay prevented, setting up hover play');
            
            // If autoplay fails, set up hover events
            video.addEventListener('mouseenter', () => {
                video.play().catch(e => {});
            });
            
            video.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        });
    }
}

// Updated render function to prioritize videos
renderArtifacts() {
    const grid = document.getElementById('artifacts-grid');
    if (!grid) return;

    let filteredArtifacts = this.artifacts;
    
    // Apply filter
    if (this.currentFilter !== 'all') {
        filteredArtifacts = this.artifacts.filter(a => a.dynasty === this.currentFilter);
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
    
    grid.innerHTML = filteredArtifacts.map(artifact => this.createArtifactCard(artifact)).join('');
    
    // Initialize video lazy loading
    setTimeout(() => {
        this.initializeGridVideos();
    }, 100);
    
    // Add click handlers
    this.bindArtifactCardEvents();
}

// Initialize videos in the grid
initializeGridVideos() {
    const videos = document.querySelectorAll('.artifacts-grid video');
    
    videos.forEach((video, index) => {
        // Stagger video loading to prevent overwhelming the browser
        setTimeout(() => {
            this.setupGridVideo(video);
        }, index * 200);
    });
}

// Setup individual grid video
setupGridVideo(video) {
    // Ensure video is properly configured
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Add loading state
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.3s ease';
    
    video.addEventListener('loadeddata', () => {
        video.style.opacity = '1';
        
        // Try to play
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // If autoplay fails, show first frame
                video.currentTime = 1; // Show frame at 1 second
            });
        }
    });
    
    // Hover effects
    video.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
    });
    
    video.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });
    
    // Handle errors gracefully
    video.addEventListener('error', () => {
        video.style.background = '#f0f0f0';
        video.style.display = 'flex';
        video.style.alignItems = 'center';
        video.style.justifyContent = 'center';
        video.innerHTML = '<span style="color: #666;">Video Loading...</span>';
    });
}

    bindArtifactCardEvents() {
        document.querySelectorAll('.artifact-card').forEach(card => {
            card.addEventListener('click', () => {
                const artifactId = parseInt(card.dataset.artifactId);
                this.openArtifactModal(artifactId);
            });
        });
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
            modalVideo.style.opacity = '0';
            setTimeout(() => {
                modalVideo.src = this.selectedArtifact.video || '/assets/videos/placeholder.mp4';
                modalVideo.style.opacity = '1';
                modalVideo.play().catch(e => console.log('Video autoplay prevented'));
            }, 200);
        }

        // Update modal info section
        const modalInfo = document.getElementById('modal-info');
        if (modalInfo) {
            modalInfo.innerHTML = this.createModalContent();
        }

        // Bind bidding events
        this.bindModalEvents();
    }

    createModalContent() {
        const artifact = this.selectedArtifact;
        return `
            <div class="modal-lot-number">LOT ${artifact.lotNumber}</div>
            <h2 class="modal-title">${artifact.title}</h2>
            <p class="modal-dynasty">${artifact.chinese} | ${artifact.dynastyInfo}</p>
            <p class="modal-description">${artifact.description}</p>
            
            <div class="detail-sections">
                <div class="detail-section">
                    <h4>Provenance</h4>
                    <p>${artifact.provenance}</p>
                </div>
                <div class="detail-section">
                    <h4>Condition</h4>
                    <p>${artifact.condition}</p>
                </div>
                <div class="detail-section">
                    <h4>Dimensions</h4>
                    <p>${artifact.dimensions}</p>
                </div>
                <div class="detail-section">
                    <h4>Literature</h4>
                    <p>${artifact.literature}</p>
                </div>
            </div>
            
            <div class="bidding-section">
                <div class="current-bid-info">
                    <div class="current-bid-label">Current Bid</div>
                    <div class="current-bid-amount">$${artifact.currentBid.toLocaleString()}</div>
                    <div class="bid-count">${artifact.bidCount} bids</div>
                </div>
                
                <div class="bid-options">
                    <div class="bid-option">
                        <h5>Place Bid for Full Ownership</h5>
                        <p>Acquire complete ownership of this artifact as an NFT. Physical artwork will be shipped to winning bidder.</p>
                        <div class="bid-input-group">
                            <input type="number" class="bid-input" id="bid-amount" placeholder="Amount in USD" step="1000" min="${artifact.currentBid + artifact.minBidIncrement}">
                            <button class="bid-button" id="place-bid-btn">Place Bid</button>
                        </div>
                        <p style="font-size: 0.75rem; margin-top: 0.5rem;">Minimum bid: $${(artifact.currentBid + artifact.minBidIncrement).toLocaleString()}</p>
                    </div>
                    
                    <div class="shipping-info">
                        <h5>Shipping & Delivery</h5>
                        <div class="shipping-details">
                            <p><strong>Worldwide shipping handled by Wenbo Museum, Beijing China</strong></p>
                            <p>Professional packaging, insurance, and authentication certificate included. Delivery within 7-14 business days after payment confirmation.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindModalEvents() {
        // Close modal button
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Place bid button
        const placeBidBtn = document.getElementById('place-bid-btn');
        if (placeBidBtn) {
            placeBidBtn.addEventListener('click', () => {
                this.placeBid();
            });
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

    async placeBid() {
        const bidInput = document.getElementById('bid-amount');
        const bidButton = document.getElementById('place-bid-btn');
        
        if (!bidInput || !bidButton) return;

        const bidAmount = parseFloat(bidInput.value);
        const minBid = this.selectedArtifact.currentBid + this.selectedArtifact.minBidIncrement;
        
        if (isNaN(bidAmount) || bidAmount < minBid) {
            this.uiManager.showToast(`Minimum bid is $${minBid.toLocaleString()}`, 'error');
            return;
        }

        // Check wallet connection
        if (!this.web3Manager.isConnected()) {
            this.uiManager.showToast('Please connect your wallet first', 'error');
            return;
        }
        
        // Disable button during transaction
        bidButton.disabled = true;
        bidButton.textContent = 'Processing...';
        
        try {
            const success = await this.web3Manager.placeBid(this.selectedArtifact.id, bidAmount);
            
            if (success) {
                // Update artifact data
                this.selectedArtifact.currentBid = bidAmount;
                this.selectedArtifact.bidCount++;
                
                this.uiManager.showToast(`Bid of $${bidAmount.toLocaleString()} placed successfully!`, 'success');
                
                // Update modal display
                document.querySelector('.current-bid-amount').textContent = `$${bidAmount.toLocaleString()}`;
                document.querySelector('.bid-count').textContent = `${this.selectedArtifact.bidCount} bids`;
                
                // Clear input
                bidInput.value = '';
                
                // Update grid after modal interaction
                setTimeout(() => {
                    this.renderArtifacts();
                    this.updateStats();
                }, 500);
            }
            
        } catch (error) {
            console.error('Error placing bid:', error);
            this.uiManager.showToast(error.message || 'Failed to place bid', 'error');
        } finally {
            bidButton.disabled = false;
            bidButton.textContent = 'Place Bid';
        }
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

// Global functions for backward compatibility
window.scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.scrollToAuctions = () => {
    document.getElementById('auctions')?.scrollIntoView({ behavior: 'smooth' });
};

window.toggleMobileMenu = () => {
    // Placeholder for mobile menu functionality
    console.log('Mobile menu toggle');
};

window.closeModal = () => {
    window.app?.closeModal();
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new YizhenApp();
    window.app.init();
});

// Initialize on window load as fallback
window.addEventListener('load', () => {
    if (!window.app) {
        window.app = new YizhenApp();
        window.app.init();
    }
});

export default YizhenApp;
