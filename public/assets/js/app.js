<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ru Kiln Ceramics & Chinese Imperial Artifacts | Yizhen 艺珍</title>
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Critical CSS - Inline for immediate rendering -->
    <style>
        /* Critical above-the-fold styles only */
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--primary:#000;--secondary:#fff;--accent:#c9302c;--gray-light:#f8f8f8;--gray-medium:#e5e5e5;--text-primary:#000;--text-secondary:#666;--font-primary:'Cormorant Garamond',serif;--font-secondary:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
        body{font-family:var(--font-secondary);background:var(--secondary);color:var(--text-primary);line-height:1.6;font-weight:300}
        body[lang="zh-TW"]{font-family:"Noto Sans TC","Source Han Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
        h1,h2,h3,h4,h5,h6{font-family:var(--font-primary);font-weight:300;letter-spacing:-0.02em}
        [lang="zh-TW"] h1,[lang="zh-TW"] h2,[lang="zh-TW"] h3,[lang="zh-TW"] h4,[lang="zh-TW"] h5,[lang="zh-TW"] h6{font-family:"Noto Serif TC","Source Han Serif TC","PingFang TC",serif}
        .loading{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;display:flex;align-items:center;justify-content:center;z-index:9999;transition:opacity .3s ease}
        .loading.hidden{opacity:0;pointer-events:none}
        .loader{width:40px;height:40px;border:2px solid var(--gray-medium);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        header{background:rgba(255,255,255,.95);border-bottom:1px solid var(--gray-medium);position:sticky;top:0;z-index:1000;padding:0 2rem;backdrop-filter:blur(10px)}
        nav{display:flex;justify-content:space-between;align-items:center;height:80px;max-width:1400px;margin:0 auto;position:relative}
        .logo{display:flex;flex-direction:column;align-items:flex-start;cursor:pointer}
        .logo-text{display:flex;align-items:baseline;gap:.5rem}
        .logo-chinese{font-family:var(--font-primary);font-size:1.25rem;font-weight:400}
        .logo-english{font-family:var(--font-primary);font-size:1.75rem;font-weight:400;letter-spacing:.05em}
        .logo-tagline{font-size:.625rem;text-transform:uppercase;letter-spacing:.2em;color:var(--text-secondary);margin-top:.25rem;font-family:var(--font-secondary)}
        [lang="zh-TW"] .logo-tagline{text-transform:none;font-size:.75rem}
        .nav-center{display:flex;gap:3rem;position:absolute;left:50%;transform:translateX(-50%)}
        .nav-center a{color:var(--text-primary);text-decoration:none;font-size:.875rem;text-transform:uppercase;letter-spacing:.1em;transition:color .3s ease;position:relative}
        [lang="zh-TW"] .nav-center a{text-transform:none;font-size:.9rem}
        .nav-center a:hover{color:var(--accent)}
        .nav-right{display:flex;align-items:center;gap:2rem}
        .language-switcher{display:flex;align-items:center;gap:.5rem;position:relative}
        .language-button{background:none;border:1px solid var(--gray-medium);padding:.5rem 1rem;cursor:pointer;font-size:.875rem;transition:all .3s ease;border-radius:4px}
        .language-button:hover{border-color:var(--text-primary)}
        .language-dropdown{position:absolute;top:100%;right:0;background:white;border:1px solid var(--gray-medium);border-radius:4px;box-shadow:0 5px 15px rgba(0,0,0,.1);z-index:1001;min-width:120px;display:none}
        .language-dropdown.show{display:block}
        .language-option{padding:.75rem 1rem;cursor:pointer;transition:background .3s ease;display:flex;align-items:center;gap:.5rem}
        .language-option:hover{background:var(--gray-light)}
        .language-option.active{background:var(--accent);color:white}
        .connect-wallet{background:var(--primary);color:var(--secondary);border:1px solid var(--primary);padding:.75rem 2rem;font-size:.875rem;text-transform:uppercase;letter-spacing:.1em;cursor:pointer;transition:all .3s ease;font-weight:400}
        [lang="zh-TW"] .connect-wallet{text-transform:none}
        .connect-wallet:hover{background:transparent;color:var(--primary)}
        .hero{height:500px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#333}
        .hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom,rgba(0,0,0,.4),rgba(0,0,0,.6));z-index:1}
        .hero-content{position:relative;z-index:2;text-align:center;color:#fff;max-width:800px;padding:0 2rem;animation:heroFadeIn 1s ease}
        @keyframes heroFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .hero h1{font-size:3.5rem;font-weight:300;margin-bottom:1rem;letter-spacing:-0.02em;font-family:var(--font-primary)}
        [lang="zh-TW"] .hero h1{font-size:3rem}
        .hero p{font-size:1.25rem;font-weight:300;opacity:.9;margin-bottom:2rem;font-family:var(--font-secondary)}
        .hero-cta{background:var(--accent);color:#fff;border:none;padding:1rem 3rem;font-size:.875rem;text-transform:uppercase;letter-spacing:.1em;cursor:pointer;transition:all .3s ease}
        [lang="zh-TW"] .hero-cta{text-transform:none;font-size:.9rem}
        .hero-cta:hover{background:#a02622;transform:translateY(-2px);box-shadow:0 10px 30px rgba(201,48,44,.3)}
        @media (max-width:768px){
            header{padding:0 1rem}
            nav{height:60px;gap:1rem}
            .nav-center{display:none}
            .nav-right{gap:1rem}
            .hero{height:400px}
            .hero h1{font-size:2rem}
            .hero p{font-size:1rem}
        }
    </style>
    
    <!-- Chinese font preload -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500&family=Noto+Serif+TC:wght@300;400;500&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    
    <!-- Preload critical fonts -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"></noscript>
    
    <!-- Meta Tags -->
    <meta name="description" content="Yizhen 艺珍 - Where Heritage Meets Innovation. Authenticated Chinese ceramics auction platform.">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    
    <!-- Main CSS -->
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
    <!-- Loading Screen -->
    <div class="loading" id="loading">
        <div class="loader"></div>
    </div>

    <header>
        <nav>
            <div class="logo" onclick="scrollToTop()">
                <div class="logo-text">
                    <div class="logo-chinese">艺珍</div>
                    <div class="logo-english">Yizhen</div>
                </div>
                <div class="logo-tagline" data-i18n="hero.tagline">Where Heritage Meets Innovation</div>
            </div>
            <div class="nav-center">
                <a href="#auctions" class="active" data-i18n="nav.auctions">Auctions</a>
                <a href="#private" data-i18n="nav.privateSales">Private Sales</a>
                <a href="#exhibitions" data-i18n="nav.exhibitions">Exhibitions</a>
                <a href="#about" data-i18n="nav.about">About</a>
            </div>
            <div class="nav-right">
                <div class="language-switcher">
                    <button class="language-button" onclick="toggleLanguageDropdown()">
                        <span id="current-language">EN</span>
                        <span>▼</span>
                    </button>
                    <div class="language-dropdown" id="language-dropdown">
                        <div class="language-option active" onclick="switchLanguage('en')">
                            <span>🇺🇸</span>
                            <span>English</span>
                        </div>
                        <div class="language-option" onclick="switchLanguage('zh')">
                            <span>🇹🇼</span>
                            <span>繁體中文</span>
                        </div>
                    </div>
                </div>
                <div class="wallet-info">
                    <button class="connect-wallet" id="connect-wallet-btn">
                        <span id="wallet-text" data-i18n="nav.connectWallet">Connect Wallet</span>
                    </button>
                </div>
                <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1 data-i18n="hero.title">Exceptional Chinese Art</h1>
            <p data-i18n="hero.subtitle">Song, Yuan & Ming Dynasty Masterpieces</p>
            <button class="hero-cta" onclick="scrollToAuctions()" data-i18n="hero.cta">View Current Auctions</button>
        </div>
    </section>

    <div class="auction-header" id="auctions">
        <h2 data-i18n="auction.featuredLots">Featured Lots</h2>
        <div class="auction-stats">
            <div class="stat-item">
                <span class="stat-value" id="total-lots">0</span>
                <span data-i18n="auction.totalLots">Total Lots</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="total-bids">0</span>
                <span data-i18n="auction.activeBids">Active Bids</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="total-value">0</span>
                <span data-i18n="auction.totalValue">Total Value (USD)</span>
            </div>
        </div>
    </div>

    <div class="filter-bar">
        <div class="dynasty-filters">
            <button class="dynasty-filter active" data-filter="all" data-i18n="auction.allDynasties">All Dynasties</button>
            <button class="dynasty-filter" data-filter="song" data-i18n="auction.songDynasty">Song Dynasty</button>
            <button class="dynasty-filter" data-filter="yuan" data-i18n="auction.yuanDynasty">Yuan Dynasty</button>
            <button class="dynasty-filter" data-filter="ming" data-i18n="auction.mingDynasty">Ming Dynasty</button>
        </div>
        <div class="sort-controls">
            <span data-i18n="auction.sortBy">Sort by:</span>
            <select class="sort-select" id="sort-select">
                <option value="lot" data-i18n="auction.lotNumber">Lot Number</option>
                <option value="price-high" data-i18n="auction.priceHighToLow">Price: High to Low</option>
                <option value="price-low" data-i18n="auction.priceLowToHigh">Price: Low to High</option>
                <option value="ending" data-i18n="auction.endingSoon">Ending Soon</option>
            </select>
        </div>
    </div>

    <!-- Artifacts Grid Container -->
    <div class="artifacts-grid" id="artifacts-grid">
        <!-- Artifact cards will be dynamically generated -->
    </div>

    <!-- Artifact Detail Modal -->
    <div class="modal" id="artifact-modal">
        <div class="modal-content">
            <button class="close-modal" onclick="closeModal()">&times;</button>
            <div class="modal-body">
                <div class="modal-video-section">
                    <video src="" autoplay muted loop class="modal-video" id="modal-video"></video>
                </div>
                <div class="modal-info-section" id="modal-info">
                    <!-- Modal content will be populated dynamically -->
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast"></div>

    <footer>
        <div class="footer-content">
            <div class="footer-logo">
                <div class="logo-text">
                    <div class="logo-chinese">艺珍</div>
                    <div class="logo-english">Yizhen</div>
                </div>
                <p class="footer-tagline" data-i18n="hero.tagline">Where Heritage Meets Innovation</p>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2024 Yizhen 艺珍. <span data-i18n="footer.allRightsReserved">All rights reserved.</span> | <span data-i18n="footer.web3AuctionHouse">Web3 Auction House</span></p>
        </div>
    </footer>

    <!-- Scripts -->
    <!-- Load translation system first -->
    <script src="/assets/js/i18n.js"></script>
    
    <!-- Load ethers.js -->
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.umd.min.js"></script>
    
    <!-- Language switching functionality -->
    <script>
        function toggleLanguageDropdown() {
            const dropdown = document.getElementById('language-dropdown');
            dropdown.classList.toggle('show');
        }
        
        function switchLanguage(lang) {
            const dropdown = document.getElementById('language-dropdown');
            const currentLang = document.getElementById('current-language');
            const options = dropdown.querySelectorAll('.language-option');
            
            // Update active state
            options.forEach(option => {
                option.classList.remove('active');
                if (option.onclick.toString().includes(lang)) {
                    option.classList.add('active');
                }
            });
            
            // Update current language display
            currentLang.textContent = lang === 'zh' ? '中文' : 'EN';
            
            // Set language in i18n system
            if (window.i18n) {
                window.i18n.setLanguage(lang);
            }
            
            // Update app if it exists
            if (window.app) {
                window.app.onLanguageChange(lang);
            }
            
            // Close dropdown
            dropdown.classList.remove('show');
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('language-dropdown');
            const button = document.querySelector('.language-button');
            if (!dropdown.contains(e.target) && !button.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Initialize language on page load
        document.addEventListener('DOMContentLoaded', () => {
            if (window.i18n) {
                const currentLang = window.i18n.getCurrentLanguage();
                const langDisplay = document.getElementById('current-language');
                if (langDisplay) {
                    langDisplay.textContent = currentLang === 'zh' ? '中文' : 'EN';
                }
                
                // Update active state
                const options = document.querySelectorAll('.language-option');
                options.forEach(option => {
                    option.classList.remove('active');
                    if (option.onclick.toString().includes(currentLang)) {
                        option.classList.add('active');
                    }
                });
            }
        });
    </script>
    
    <!-- Inline the complete artifacts data -->
    <script>
        window.artifactsData = [
            {
                "id": 1,
                "lotNumber": "001",
                "title": "NORTHERN SONG DYNASTY JUN WARE WASHER (OFFICIAL KILN)",
                "titleZh": "北宋 钧窑洗（官窑）",
                "chinese": "北宋 钧窑洗",
                "dynasty": "song",
                "dynastyInfo": "Northern Song Dynasty, 960-1127 AD",
                "dynastyInfoZh": "北宋，960-1127年",
                "videoOrientation": "landscape",
                "video": "/assets/videos/relics/001-jun-washer/main.mp4",
                "description": "This refined ceramic washer—used likely in scholarly or calligraphic rituals—epitomizes the artistry of Jun ware from the Northern Song official kilns. Its shape is minimalist yet dignified: a shallow basin with slightly upturned walls, complemented by a distinctive small ornamental lug or \"ear\" on the rim. The glaze exhibits quintessential Jun characteristics: a luscious layering of lavender-blue merging into deep crimson splashes, created through copper oxide under reduction firing.",
                "descriptionZh": "這件精緻的筆洗——可能用於文人或書法儀式——體現了北宋官窯鈞窯的藝術造詣。其形態簡約而莊重：淺盆狀，壁面略向上翹，邊緣配有獨特的小裝飾耳。釉面呈現典型的鈞窯特色：豐富的薰衣草藍色層次融合成深紅色斑點，通過還原焰中的氧化銅而形成。",
                "estimate": { "low": 80000, "high": 120000 },
                "currentBid": 92000,
                "minBidIncrement": 2000,
                "bidCount": 23,
                "endTime": 1734062400000,
                "provenance": "Private Collection, acquired 1980s\nThermoluminescence tested\nPublished in Jun Ware Studies, 2019",
                "provenanceZh": "私人收藏，1980年代購入\n熱釋光測試\n刊載於《鈞窯研究》，2019年",
                "condition": "Excellent condition with characteristic ice-crackle throughout the glaze. Minor expected wear to the foot ring consistent with age.",
                "conditionZh": "狀況極佳，整個釉面呈現特有的冰裂紋。圈足有輕微磨損，符合年代特徵。",
                "dimensions": "Diameter: Approx. 20 cm (7.9 in)\nHeight: Approx. 10 cm (3.9 in)",
                "dimensionsZh": "直徑：約20厘米（7.9英寸）\n高度：約10厘米（3.9英寸）",
                "literature": "Compare with similar examples in the Palace Museum collections. See \"Jun Ware of the Song Dynasty\", Beijing, 2018, pl. 45.",
                "literatureZh": "可與故宮博物院收藏的類似例子對比。參見《宋代鈞窯》，北京，2018年，圖版45。"
            },
            {
                "id": 2,
                "lotNumber": "002",
                "title": "NORTHERN SONG DYNASTY JUN KILN LYING-FOOT PLATE",
                "titleZh": "北宋 钧窑卧足盘",
                "chinese": "北宋 钧窑卧足盘",
                "dynasty": "song",
                "dynastyInfo": "Northern Song Dynasty, 960-1127 AD",
                "dynastyInfoZh": "北宋，960-1127年",
                "videoOrientation": "square",
                "video": "/assets/videos/relics/002-jun-plate/main.mp4",
                "description": "This refined ceramic piece is a lying-foot plate from the prestigious Jun kilns, often associated with the scholarly and contemplative culture of the Northern Song Dynasty. The glaze presents a light bluish-grey base, overlaid with lavender and crimson splashes, showcasing the unpredictable magic of copper-based pigments fired under reduction conditions.",
                "descriptionZh": "這件精緻的陶瓷作品是來自聲譽卓著的鈞窯的臥足盤，常與北宋文人和沉思文化相關。釉面呈現淺藍灰色底色，覆蓋著薰衣草色和深紅色斑點，展現了還原條件下燒製的銅基顏料的不可預測魔力。",
                "estimate": { "low": 20000, "high": 30000 },
                "currentBid": 24000,
                "minBidIncrement": 1000,
                "bidCount": 15,
                "endTime": 1734235200000,
                "provenance": "European private collection, acquired 1970s\nAuthenticity confirmed by Oxford TL dating",
                "provenanceZh": "歐洲私人收藏，1970年代購入\n牛津熱釋光測年確認真實性",
                "condition": "Very good condition with high gloss surface and fine crackling, accentuating age and kiln mastery.",
                "conditionZh": "狀況極佳，表面高光澤，細裂紋突出了年代和窯技精湛。",
                "dimensions": "Diameter: Approx. 22–25 cm (8.7–9.8 in)\nHeight: Approx. 4–6 cm (1.6–2.4 in)",
                "dimensionsZh": "直徑：約22-25厘米（8.7-9.8英寸）\n高度：約4-6厘米（1.6-2.4英寸）",
                "literature": "Referenced in \"Song Dynasty Ceramics\", London, 2015, fig. 127.",
                "literatureZh": "參見《宋代陶瓷》，倫敦，2015年，圖127。"
            },
            // Add more artifacts with Chinese translations...
        ];
    </script>
    
    <!-- Load application as regular script, not module -->
    <script src="/assets/js/app.js"></script>
    
    <!-- Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                console.log('Service worker disabled for debugging');
            });
        }
    </script>
</body>
</html>
