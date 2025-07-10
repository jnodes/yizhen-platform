#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Yizhen Compliance System...');

// Copy compliance files to public directory
const files = [
    {
        source: './compliance/core/compliance-ai-agent.js',
        destination: './public/assets/js/compliance-ai-agent.js'
    },
    {
        source: './compliance/core/compliance-integration.js',
        destination: './public/assets/js/compliance-integration.js'
    }
];

files.forEach(file => {
    fs.copyFileSync(file.source, file.destination);
    console.log(`✅ Copied ${file.source} to ${file.destination}`);
});

console.log('✨ Compliance system installed successfully!');
