// UI Manager Module for Enhanced User Experience
export class UIManager {
    constructor() {
        this.toastQueue = [];
        this.isToastShowing = false;
        this.animations = new Map();
        this.touchStartY = 0;
        this.touchEndY = 0;
    }

    init() {
        this.setupGlobalEventListeners();
        this.setupTouchGestures();
        this.setupKeyboardNavigation();
        this.setupAccessibility();
        console.log('UI Manager initialized');
    }

    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Connection lost - some features may be limited', 'warning');
        });

        // Handle window focus
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    }

    setupTouchGestures() {
        // Add swipe gestures for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }

    setupAccessibility() {
        // Add skip to content link
        this.addSkipToContentLink();
        
        // Improve focus indicators
        this.enhanceFocusIndicators();
        
        // Add aria labels where needed
        this.enhanceAriaLabels();
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 4000) {
        const toast = {
            message,
            type,
            duration,
            id: Date.now() + Math.random()
        };

        this.toastQueue.push(toast);
        
        if (!this.isToastShowing) {
            this.processToastQueue();
        }
    }

    async processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isToastShowing = false;
            return;
        }

        this.isToastShowing = true;
        const toast = this.toastQueue.shift();
        
        await this.displayToast(toast);
        
        // Process next toast after a brief delay
        setTimeout(() => {
            this.processToastQueue();
        }, 300);
    }

    async displayToast(toast) {
        return new Promise((resolve) => {
            const toastElement = this.createToastElement(toast);
            document.body.appendChild(toastElement);
            
            // Trigger entrance animation
            requestAnimationFrame(() => {
                toastElement.classList.add('show');
            });
            
            // Auto-hide after duration
            const hideTimer = setTimeout(() => {
                this.hideToast(toastElement, resolve);
            }, toast.duration);
            
            // Allow manual dismissal
            toastElement.addEventListener('click', () => {
                clearTimeout(hideTimer);
                this.hideToast(toastElement, resolve);
            });
        });
    }

    createToastElement(toast) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${toast.type}`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'polite');
        toastElement.innerHTML = `
            <span class="toast-message">${toast.message}</span>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;
        
        // Add close button functionality
        toastElement.querySelector('.toast-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideToast(toastElement);
        });
        
        return toastElement;
    }

    hideToast(toastElement, callback) {
        toastElement.classList.remove('show');
        
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
            if (callback) callback();
        }, 300);
    }

    // Loading states
    showLoading(message = 'Loading...') {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loader"></div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingElement);
        
        requestAnimationFrame(() => {
            loadingElement.classList.add('show');
        });
        
        return loadingElement;
    }

    hideLoading(loadingElement) {
        if (!loadingElement) return;
        
        loadingElement.classList.remove('show');
        setTimeout(() => {
            if (loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
            }
        }, 300);
    }

    // Smooth scrolling utilities
    smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 1000); // Max 1 second
        
        this.animateScroll(startPosition, distance, duration);
    }

    animateScroll(start, distance, duration) {
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            window.scrollTo(0, start + distance * easeOut);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    }

    // Form validation and enhancement
    enhanceForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            this.enhanceInput(input);
        });
    }

    enhanceInput(input) {
        // Add real-time validation
        input.addEventListener('blur', () => {
            this.validateInput(input);
        });
        
        // Add input formatting
        if (input.type === 'number') {
            input.addEventListener('input', () => {
                this.formatNumberInput(input);
            });
        }
    }

    validateInput(input) {
        const isValid = input.checkValidity();
        const errorElement = input.parentNode.querySelector('.error-message');
        
        if (!isValid) {
            if (!errorElement) {
                const error = document.createElement('div');
                error.className = 'error-message';
                error.textContent = input.validationMessage;
                input.parentNode.appendChild(error);
            }
            input.classList.add('invalid');
        } else {
            if (errorElement) {
                errorElement.remove();
            }
            input.classList.remove('invalid');
        }
        
        return isValid;
    }

    formatNumberInput(input) {
        let value = input.value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        input.value = value;
    }

    // Responsive utilities
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration, fill: 'forwards' });
    }

    fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration, fill: 'forwards' });
    }

    slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: ['translateY(20px)', 'translateY(0)'],
            down: ['translateY(-20px)', 'translateY(0)'],
            left: ['translateX(20px)', 'translateX(0)'],
            right: ['translateX(-20px)', 'translateX(0)']
        };
        
        return this.animate(element, [
            { opacity: 0, transform: transforms[direction][0] },
            { opacity: 1, transform: transforms[direction][1] }
        ], { duration, fill: 'forwards' });
    }

    animate(element, keyframes, options) {
        if (!element.animate) {
            // Fallback for browsers without Web Animations API
            return Promise.resolve();
        }
        
        const animation = element.animate(keyframes, options);
        this.animations.set(element, animation);
        
        animation.addEventListener('finish', () => {
            this.animations.delete(element);
        });
        
        return animation.finished;
    }

    // Event handlers
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause non-critical animations
            this.pauseAnimations();
        } else {
            // Page is visible, resume animations
            this.resumeAnimations();
        }
    }

    handleWindowFocus() {
        // Resume any paused functionality
        console.log('Window focused');
    }

    handleWindowBlur() {
        // Pause non-critical functionality
        console.log('Window blurred');
    }

    handleTouchStart(e) {
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchEnd(e) {
        this.touchEndY = e.changedTouches[0].screenY;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeDistance = this.touchStartY - this.touchEndY;
        const minSwipeDistance = 50;
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swipe up
                this.handleSwipeUp();
            } else {
                // Swipe down
                this.handleSwipeDown();
            }
        }
    }

    handleSwipeUp() {
        // Could be used for modal dismissal or navigation
        console.log('Swipe up detected');
    }

    handleSwipeDown() {
        // Could be used for refresh or navigation
        console.log('Swipe down detected');
    }

    handleKeyboardNavigation(e) {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
            }
        }
        
        // Handle escape key
        if (e.key === 'Escape') {
            this.handleEscape();
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    handleEscape() {
        // Close any open modals or overlays
        const modal = document.querySelector('.modal[style*="block"]');
        if (modal && window.closeModal) {
            window.closeModal();
        }
    }

    // Accessibility enhancements
    addSkipToContentLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-to-content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    enhanceFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible {
                outline: 2px solid var(--accent) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    enhanceAriaLabels() {
        // Add aria-labels to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.textContent.trim() && !button.querySelector('[aria-hidden="false"]')) {
                // This button needs an aria-label
                const context = this.getButtonContext(button);
                if (context) {
                    button.setAttribute('aria-label', context);
                }
            }
        });
    }

    getButtonContext(button) {
        // Try to determine button purpose from context
        if (button.classList.contains('close')) return 'Close';
        if (button.classList.contains('menu')) return 'Menu';
        if (button.classList.contains('search')) return 'Search';
        return null;
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Animation control
    pauseAnimations() {
        this.animations.forEach(animation => {
            if (animation.playState === 'running') {
                animation.pause();
            }
        });
    }

    resumeAnimations() {
        this.animations.forEach(animation => {
            if (animation.playState === 'paused') {
                animation.play();
            }
        });
    }

    // Cleanup
    destroy() {
        this.animations.forEach(animation => {
            animation.cancel();
        });
        this.animations.clear();
        this.toastQueue = [];
    }
}
