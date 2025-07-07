// Lazy Loader Module for Performance Optimization
export class LazyLoader {
    constructor() {
        this.observers = new Map();
        this.loadedVideos = new Set();
        this.config = {
            rootMargin: '50px 0px',
            threshold: 0.1
        };
    }

    init() {
        // Initialize Intersection Observer for lazy loading
        this.setupVideoLazyLoading();
        this.setupImageLazyLoading();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        console.log('Lazy Loader initialized');
    }

    setupVideoLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllVideos();
            return;
        }

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVideo(entry.target);
                    videoObserver.unobserve(entry.target);
                }
            });
        }, this.config);

        this.observers.set('video', videoObserver);
    }

    setupImageLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, this.config);

        this.observers.set('image', imageObserver);
    }

    observe() {
        // Observe all lazy-loadable elements
        this.observeVideos();
        this.observeImages();
    }

    observeVideos() {
        const videoObserver = this.observers.get('video');
        if (!videoObserver) return;

        const lazyVideos = document.querySelectorAll('video.lazy');
        lazyVideos.forEach(video => {
            videoObserver.observe(video);
        });
    }

    observeImages() {
        const imageObserver = this.observers.get('image');
        if (!imageObserver) return;

        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });
    }

    loadVideo(video) {
        if (this.loadedVideos.has(video)) return;

        const videoSrc = video.dataset.src || video.src;
        if (!videoSrc) return;

        // Create a new video element to test loading
        const testVideo = document.createElement('video');
        testVideo.preload = 'metadata';
        
        testVideo.addEventListener('loadedmetadata', () => {
            // Video metadata loaded successfully
            video.src = videoSrc;
            video.classList.remove('lazy');
            video.classList.add('loaded');
            
            // Auto-play if in viewport and user prefers reduced motion is not set
            if (this.shouldAutoPlay()) {
                video.play().catch(e => {
                    console.log('Autoplay prevented for video:', e);
                });
            }
            
            this.loadedVideos.add(video);
        });

        testVideo.addEventListener('error', () => {
            console.error('Failed to load video:', videoSrc);
            this.handleVideoError(video);
        });

        testVideo.src = videoSrc;
    }

    loadImage(image) {
        const imageSrc = image.dataset.src;
        if (!imageSrc) return;

        const img = new Image();
        img.onload = () => {
            image.src = imageSrc;
            image.classList.remove('lazy');
            image.classList.add('loaded');
        };
        
        img.onerror = () => {
            console.error('Failed to load image:', imageSrc);
            this.handleImageError(image);
        };
        
        img.src = imageSrc;
    }

    handleVideoError(video) {
        // Fallback to placeholder or default video
        video.src = '/assets/videos/placeholder.mp4';
        video.classList.remove('lazy');
        video.classList.add('error');
    }

    handleImageError(image) {
        // Fallback to placeholder image
        image.src = '/assets/images/placeholder.jpg';
        image.classList.remove('lazy');
        image.classList.add('error');
    }

    shouldAutoPlay() {
        // Check if user prefers reduced motion
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    loadAllVideos() {
        // Fallback for browsers without Intersection Observer
        const lazyVideos = document.querySelectorAll('video.lazy');
        lazyVideos.forEach(video => {
            this.loadVideo(video);
        });
    }

    preloadCriticalResources() {
        // Preload hero image and first few artifacts
        this.preloadHeroResources();
        this.preloadFirstArtifacts();
    }

    preloadHeroResources() {
        // Preload hero background image
        const heroImage = new Image();
        heroImage.src = '/assets/images/hero-bg.jpg';
    }

    preloadFirstArtifacts() {
        // Preload first 3 artifact videos for immediate display
        const criticalVideos = [
            '/assets/videos/relics/001-jun-washer/main.mp4',
            '/assets/videos/relics/002-jun-plate/main.mp4',
            '/assets/videos/relics/003-celadon-bowl/main.mp4'
        ];

        criticalVideos.forEach((src, index) => {
            setTimeout(() => {
                this.preloadVideo(src);
            }, index * 200); // Stagger loading
        });
    }

    preloadVideo(src) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
            console.log('Preloaded video:', src);
        });
    }

    // Progressive image loading
    createProgressiveImage(lowQualitySrc, highQualitySrc, container) {
        // Create low quality placeholder
        const placeholder = new Image();
        placeholder.className = 'progressive-placeholder';
        placeholder.style.filter = 'blur(20px)';
        placeholder.style.transform = 'scale(1.1)';
        
        // Create high quality image
        const fullImage = new Image();
        fullImage.className = 'progressive-full';
        fullImage.style.position = 'absolute';
        fullImage.style.top = '0';
        fullImage.style.left = '0';
        fullImage.style.opacity = '0';
        fullImage.style.transition = 'opacity 0.3s ease';
        
        // Load placeholder first
        placeholder.onload = () => {
            container.appendChild(placeholder);
            
            // Then load full image
            fullImage.onload = () => {
                container.appendChild(fullImage);
                fullImage.style.opacity = '1';
                
                // Remove placeholder after transition
                setTimeout(() => {
                    if (placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }
                }, 300);
            };
            
            fullImage.src = highQualitySrc;
        };
        
        placeholder.src = lowQualitySrc;
    }

    // Prefetch next page content
    prefetchNextContent() {
        // Prefetch additional artifacts that might be needed
        const nextBatch = [
            '/assets/videos/relics/004-begonia-wash/main.mp4',
            '/assets/videos/relics/005-ge-pen-wash/main.mp4'
        ];

        nextBatch.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // Performance monitoring
    measureLazyLoadingPerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('video') || entry.name.includes('image')) {
                        console.log(`Resource loaded: ${entry.name} in ${entry.duration}ms`);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    // Cleanup method
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.loadedVideos.clear();
    }

    // Utility methods
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Video quality adaptation based on connection
    adaptVideoQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            // Adjust video quality based on connection speed
            switch (effectiveType) {
                case 'slow-2g':
                case '2g':
                    this.setVideoQuality('low');
                    break;
                case '3g':
                    this.setVideoQuality('medium');
                    break;
                case '4g':
                default:
                    this.setVideoQuality('high');
                    break;
            }
        }
    }

    setVideoQuality(quality) {
        const qualityMap = {
            low: '480p',
            medium: '720p',
            high: '1080p'
        };
        
        console.log(`Setting video quality to: ${qualityMap[quality]}`);
        // Implementation would adjust video sources based on quality
    }

    // Batch DOM updates for performance
    batchDOMUpdates(updates) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    // Memory management
    cleanupUnusedResources() {
        // Remove videos that are far out of viewport
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const isVisible = rect.bottom >= -200 && rect.top <= window.innerHeight + 200;
            
            if (!isVisible && video.src) {
                // Pause and clear source for videos far from viewport
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
        });
    }
}
