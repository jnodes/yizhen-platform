# Yizhen Platform - NFT Chinese Ceramics Auction

High-performance Web3 auction platform for authenticated Chinese ceramics with NFT ownership and physical delivery.

## Overview

Yizhen (艺珍) is a blockchain-powered auction platform that bridges traditional Chinese art collecting with Web3 technology. When collectors win an auction, they receive:

1. **NFT Ownership Token** - Proof of ownership on blockchain
2. **Physical Ceramic Artwork** - Shipped directly to the winner

## Key Features

- **Full NFT Ownership**: ERC721 tokens representing complete ownership (no fractional shares)
- **Physical Delivery**: Winners provide shipping address on-chain for artwork delivery
- **Authenticated Artifacts**: Thermoluminescence testing and expert authentication
- **Multi-language Support**: English and Traditional Chinese
- **Real-time Bidding**: Live auction updates via blockchain events
- **Shipping Tracking**: On-chain tracking number storage

## Smart Contract Architecture

### YizhenCeramicsNFT.sol
- ERC721 NFT contract for ceramic ownership
- Stores artwork metadata and shipping information
- Tracks authenticity certificates
- Manages shipping status

### YizhenAuction.sol
- Handles auction creation and bidding
- Automatically mints NFT to auction winner
- Manages platform fees (2.5% default)
- Supports reserve prices and bid increments

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin 5.0
- **Blockchain**: Ethereum (Sepolia testnet / Mainnet)
- **Frontend**: Vanilla JavaScript, Web3.js, Ethers.js
- **Hosting**: Vercel
- **Storage**: IPFS for metadata and images

## Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/yizhen-platform.git
   cd yizhen-platform
   ```

2. **Deploy Contracts**
   - Follow the [Deployment Guide](./deployment-guide.md)
   - Update contract addresses in `web3.js`

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   ```bash
   vercel
   ```

## Project Structure

```
yizhen-platform/
├── public/
│   ├── assets/
│   │   ├── css/         # Stylesheets
│   │   ├── js/          # JavaScript files
│   │   │   ├── app.js   # Main application
│   │   │   ├── web3.js  # Blockchain integration
│   │   │   └── i18n.js  # Translations
│   │   ├── data/        # Artifact data
│   │   ├── videos/      # Artifact videos
│   │   └── abi/         # Contract ABIs
│   ├── index.html       # Main page
│   └── manifest.json    # PWA manifest
├── contracts/           # Solidity contracts
├── scripts/            # Build scripts
└── vercel.json         # Vercel config
```

## Auction Process

1. **Create Auction** (Admin)
   - Set lot details, starting price, reserve price
   - Upload metadata to IPFS
   - Create auction on blockchain

2. **Place Bids** (Users)
   - Connect MetaMask wallet
   - Place ETH bids above minimum increment
   - Automatic 5-minute extension for last-minute bids

3. **Auction Ends**
   - NFT automatically minted to winner
   - Platform fee deducted
   - Seller receives proceeds

4. **Shipping**
   - Winner provides shipping address on-chain
   - Platform ships artwork and updates tracking
   - NFT includes shipping status

## Configuration

### Contract Addresses
Edit `public/assets/js/web3.js`:
```javascript
this.contractAddresses = {
    auction: "YOUR_AUCTION_CONTRACT",
    nft: "YOUR_NFT_CONTRACT"
};
```

### Network Settings
```javascript
this.networkConfig = {
    chainId: 11155111n, // Sepolia
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_KEY']
};
```

### Platform Fees
Default: 2.5% (adjustable up to 10%)

## API Integration

### IPFS Metadata
Each NFT points to IPFS metadata containing:
- High-resolution images
- Detailed descriptions in English/Chinese
- Authenticity certificates
- Academic references

### Example Metadata Structure
See [nft-metadata-example.json](./nft-metadata-example.json)

## Testing

1. **Deploy to Sepolia Testnet**
2. **Get Test ETH** from [Sepolia Faucet](https://sepoliafaucet.com)
3. **Create Test Auction** via Remix
4. **Place Test Bids** through UI
5. **Verify NFT Minting** on Etherscan

## Security

- Contracts use OpenZeppelin's battle-tested implementations
- ReentrancyGuard prevents reentrancy attacks
- Pausable functionality for emergencies
- Owner-only administrative functions
- Secure fund handling with pull pattern

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file

## Support

- **Documentation**: See deployment guide
- **Issues**: GitHub Issues
- **Smart Contract Queries**: Etherscan verified contracts

## Roadmap

- [ ] Admin dashboard for auction management
- [ ] Integration with shipping providers
- [ ] Email notifications
- [ ] Secondary market royalties
- [ ] Mobile app
- [ ] AR preview of ceramics
- [ ] Multi-currency support
- [ ] Decentralized governance

## Acknowledgments

- OpenZeppelin for secure contract libraries
- Chinese ceramics experts for authentication
- Web3 community for feedback and testing
