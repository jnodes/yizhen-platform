#!/usr/bin/env node

// JavaScript Optimization Script for Vercel Build
// Minifies and optimizes JavaScript files for production

const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');

class JavaScriptOptimizer {
    constructor() {
        this.inputDir = 'public/assets/js';
        this.outputDir = 'public/assets/js';
        this.terserOptions = {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.warn'],
                passes: 2,
                unsafe: false,
                unsafe_comps: false,
                unsafe_Function: false,
                unsafe_math: false,
                unsafe_symbols: false,
                unsafe_methods: false,
                unsafe_proto: false,
                unsafe_regexp: false,
                unsafe_undefined: false
            },
            mangle: {
                toplevel: false,
                safari10: true,
                reserved: ['ethers', 'ethereum', 'web3']
            },
            format: {
                comments: false,
                ascii_only: true
            },
            sourceMap: {
                filename: 'main.js',
                url: 'main.js.map'
            },
            ecma: 2020,
            module: true,
            toplevel: false
        };
        this.stats = {
            filesProcessed: 0,
            totalOriginalSize: 0,
            totalMinifiedSize: 0,
            errors: []
        };
    }

    async optimize() {
        console.log('🔧 Starting JavaScript optimization for Vercel...');
        
        try {
            const jsFiles = await this.findJavaScriptFiles();
            
            if (jsFiles.length === 0) {
                console.log('ℹ️  No JavaScript files found to optimize');
                return;
            }
            
            console.log(`📁 Found ${jsFiles.length} JavaScript files`);
            
            for (const file of jsFiles) {
                await this.optimizeFile(file);
            }
            
            await this.generateReport();
            console.log('✅ JavaScript optimization complete!');
            
        } catch (error) {
            console.error('❌ JavaScript optimization failed:', error.message);
            process.exit(1);
        }
    }

    async findJavaScriptFiles() {
        const files = [];
        
        try {
            const items = await fs.readdir(this.inputDir);
            
            for (const item of items) {
                if (item.endsWith('.js') && !item.endsWith('.min.js')) {
                    const filePath = path.join(this.inputDir, item);
                    const stat = await fs.stat(filePath);
                    
                    if (stat.isFile()) {
                        files.push({
                            name: item,
                            path: filePath,
                            size: stat.size
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️  Could not read directory ${this.inputDir}:`, error.message);
        }
        
        return files;
    }

    async optimizeFile(file) {
        try {
            console.log(`🔄 Optimizing ${file.name}...`);
            
            // Read original file
            const code = await fs.readFile(file.path, 'utf8');
            this.stats.totalOriginalSize += file.size;
            
            // Minify with Terser
            const result = await minify(code, this.terserOptions);
            
            if (result.error) {
                throw new Error(`Terser error: ${result.error}`);
            }
            
            // Generate output filename
            const baseName = path.parse(file.name).name;
            const minifiedPath = path.join(this.outputDir, `${baseName}.min.js`);
            const sourceMapPath = path.join(this.outputDir, `${baseName}.min.js.map`);
            
            // Write minified file
            await fs.writeFile(minifiedPath, result.code);
            
            // Write source map if generated
            if (result.map) {
                await fs.writeFile(sourceMapPath, result.map);
            }
            
            // Calculate compression stats
            const minifiedSize = Buffer.byteLength(result.code, 'utf8');
            this.stats.totalMinifiedSize += minifiedSize;
            const compressionRatio = ((file.size - minifiedSize) / file.size * 100).toFixed(1);
            
            console.log(`   ✅ ${baseName}.min.js: ${this.formatBytes(minifiedSize)} (${compressionRatio}% smaller)`);
            
            // Update HTML references if this is the main file
            if (file.name === 'app.js') {
                await this.updateHTMLReferences();
            }
            
            this.stats.filesProcessed++;
            
        } catch (error) {
            const errorMsg = `Failed to optimize ${file.name}: ${error.message}`;
            this.stats.errors.push(errorMsg);
            console.error(`   ❌ ${errorMsg}`);
        }
    }

    async updateHTMLReferences() {
        try {
            const htmlPath = 'public/index.html';
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // Replace JS references with minified versions
            const replacements = [
                { from: '/assets/js/app.js', to: '/assets/js/app.min.js' },
                { from: '/assets/js/web3.js', to: '/assets/js/web3.min.js' },
                { from: '/assets/js/lazy-loader.js', to: '/assets/js/lazy-loader.min.js' },
                { from: '/assets/js/ui-manager.js', to: '/assets/js/ui-manager.min.js' }
            ];
            
            let updated = false;
            for (const replacement of replacements) {
                if (html.includes(replacement.from)) {
                    html = html.replace(new RegExp(replacement.from, 'g'), replacement.to);
                    updated = true;
                }
            }
            
            if (updated) {
                await fs.writeFile(htmlPath, html);
                console.log('   🔄 Updated HTML references to minified files');
            }
            
        } catch (error) {
            console.warn('   ⚠️  Could not update HTML references:', error.message);
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            platform: 'vercel',
            files: {
                processed: this.stats.filesProcessed,
                errors: this.stats.errors.length
            },
            size: {
                original: this.formatBytes(this.stats.totalOriginalSize),
                minified: this.formatBytes(this.stats.totalMinifiedSize),
                savings: this.stats.totalOriginalSize > 0 
                    ? `${((this.stats.totalOriginalSize - this.stats.totalMinifiedSize) / this.stats.totalOriginalSize * 100).toFixed(1)}%`
                    : '0%'
            },
            errors: this.stats.errors
        };
        
        console.log('\n📊 JavaScript Optimization Report:');
        console.log(`   📁 Files processed: ${report.files.processed}`);
        console.log(`   📦 Original size: ${report.size.original}`);
        console.log(`   🗜️  Minified size: ${report.size.minified}`);
        console.log(`   💾 Space saved: ${report.size.savings}`);
        
        if (report.errors.length > 0) {
            console.log(`   ⚠️  Errors: ${report.errors.length}`);
            report.errors.forEach(error => console.log(`      - ${error}`));
        }
        
        // Save report for Vercel Analytics
        try {
            await fs.writeFile('public/js-optimization-report.json', JSON.stringify(report, null, 2));
        } catch (error) {
            console.warn('Could not save optimization report:', error.message);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }
}

// Image Optimization Script for Vercel
class ImageOptimizer {
    constructor() {
        this.inputDir = 'public/assets/images';
        this.outputDir = 'public/assets/images/optimized';
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif'];
        this.outputFormats = ['webp', 'avif'];
        this.qualities = [85, 70, 50];
        this.responsiveSizes = [400, 800, 1200, 1600];
    }

    async optimize() {
        console.log('🖼️  Starting image optimization for Vercel...');
        
        try {
            // Check if Sharp is available
            const sharp = await this.loadSharp();
            if (!sharp) {
                console.log('ℹ️  Sharp not available, skipping image optimization');
                return;
            }
            
            await this.ensureOutputDir();
            const images = await this.findImages();
            
            if (images.length === 0) {
                console.log('ℹ️  No images found to optimize');
                return;
            }
            
            console.log(`📁 Found ${images.length} images to optimize`);
            
            for (const image of images) {
                await this.optimizeImage(image, sharp);
            }
            
            console.log('✅ Image optimization complete!');
            
        } catch (error) {
            console.error('❌ Image optimization failed:', error.message);
            // Don't fail the build for image optimization errors
        }
    }

    async loadSharp() {
        try {
            return require('sharp');
        } catch (error) {
            console.log('Sharp not installed, image optimization will be handled by Vercel');
            return null;
        }
    }

    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async findImages() {
        const images = [];
        
        try {
            const files = await fs.readdir(this.inputDir);
            
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (this.supportedFormats.includes(ext)) {
                    const filePath = path.join(this.inputDir, file);
                    const stat = await fs.stat(filePath);
                    
                    if (stat.isFile()) {
                        images.push({
                            name: file,
                            path: filePath,
                            size: stat.size
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Could not scan images directory:', error.message);
        }
        
        return images;
    }

    async optimizeImage(image, sharp) {
        try {
            console.log(`🔄 Optimizing ${image.name}...`);
            
            const baseName = path.parse(image.name).name;
            const imageProcessor = sharp(image.path);
            const metadata = await imageProcessor.metadata();
            
            // Generate different formats
            for (const format of this.outputFormats) {
                for (const quality of this.qualities) {
                    const outputPath = path.join(this.outputDir, `${baseName}_q${quality}.${format}`);
                    
                    let processor = imageProcessor.clone();
                    
                    if (format === 'webp') {
                        processor = processor.webp({ quality });
                    } else if (format === 'avif') {
                        processor = processor.avif({ quality });
                    }
                    
                    await processor.toFile(outputPath);
                }
            }
            
            // Generate responsive sizes
            for (const size of this.responsiveSizes) {
                if (metadata.width > size) {
                    const outputPath = path.join(this.outputDir, `${baseName}_${size}w.webp`);
                    await imageProcessor
                        .clone()
                        .resize(size)
                        .webp({ quality: 85 })
                        .toFile(outputPath);
                }
            }
            
            console.log(`   ✅ Generated ${this.outputFormats.length * this.qualities.length} optimized versions`);
            
        } catch (error) {
            console.warn(`   ⚠️  Could not optimize ${image.name}:`, error.message);
        }
    }
}

// Sitemap Generator for Vercel
class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://yizhen-platform.vercel.app';
        this.outputPath = 'public/sitemap.xml';
    }

    async generate() {
        console.log('🗺️  Generating sitemap...');
        
        try {
            const sitemap = this.createSitemap();
            await fs.writeFile(this.outputPath, sitemap);
            console.log('✅ Sitemap generated successfully');
        } catch (error) {
            console.warn('⚠️  Could not generate sitemap:', error.message);
        }
    }

    createSitemap() {
        const urls = [
            { loc: '/', priority: '1.0', changefreq: 'daily' },
            { loc: '/#auctions', priority: '0.9', changefreq: 'hourly' },
            { loc: '/private', priority: '0.8', changefreq: 'weekly' },
            { loc: '/exhibitions', priority: '0.7', changefreq: 'weekly' },
            { loc: '/about', priority: '0.6', changefreq: 'monthly' }
        ];
        
        const urlset = urls.map(url => `
    <url>
        <loc>${this.baseUrl}${url.loc}</loc>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    </url>`).join('');
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    try {
        if (args.includes('--js-only')) {
            const jsOptimizer = new JavaScriptOptimizer();
            await jsOptimizer.optimize();
        } else if (args.includes('--images-only')) {
            const imageOptimizer = new ImageOptimizer();
            await imageOptimizer.optimize();
        } else if (args.includes('--sitemap-only')) {
            const sitemapGenerator = new SitemapGenerator();
            await sitemapGenerator.generate();
        } else {
            // Run all optimizations
            const jsOptimizer = new JavaScriptOptimizer();
            const imageOptimizer = new ImageOptimizer();
            const sitemapGenerator = new SitemapGenerator();
            
            await jsOptimizer.optimize();
            await imageOptimizer.optimize();
            await sitemapGenerator.generate();
        }
        
        console.log('🎉 All optimizations complete! Ready for Vercel deployment.');
        
    } catch (error) {
        console.error('💥 Optimization failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { JavaScriptOptimizer, ImageOptimizer, SitemapGenerator };
