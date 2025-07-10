// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IYizhenCeramicsNFT {
    function mintCeramic(
        address winner,
        string memory lotNumber,
        string memory title,
        string memory titleZh,
        string memory dynasty,
        string memory metadataURI
    ) external returns (uint256);
}

/**
 * @title YizhenAuctionMinimal
 * @dev Minimal auction contract to avoid stack too deep issues
 */
contract YizhenAuctionMinimal is Ownable, ReentrancyGuard, Pausable {
    
    struct Auction {
        // Pack price data together
        uint128 startingPrice;
        uint128 reservePrice;
        uint128 minBidIncrement;
        uint128 highestBid;
        // Pack time data
        uint64 startTime;
        uint64 endTime;
        // Pack addresses and flags
        address highestBidder;
        bool ended;
        bool nftMinted;
        // Separate string storage
        uint256 metadataId;
    }
    
    struct AuctionMetadata {
        string lotNumber;
        string title;
        string titleZh;
        string dynasty;
        string tokenURI;
    }
    
    IYizhenCeramicsNFT public nftContract;
    uint256 public nextAuctionId;
    uint256 public platformFeePercentage = 250;
    address public feeRecipient;
    
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => AuctionMetadata) public auctionMetadata;
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;
    mapping(address => bool) public authorizedSellers;
    
    event AuctionCreated(uint256 indexed auctionId, uint256 startingPrice);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);
    
    constructor(address _nftContract, address _feeRecipient) Ownable(msg.sender) {
        nftContract = IYizhenCeramicsNFT(_nftContract);
        feeRecipient = _feeRecipient;
        authorizedSellers[msg.sender] = true;
    }
    
    function createAuction(
        uint128 startingPrice,
        uint128 reservePrice,
        uint128 minBidIncrement,
        uint64 duration
    ) external onlyAuthorizedSeller whenNotPaused returns (uint256) {
        require(startingPrice > 0, "Invalid price");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        
        uint256 auctionId = nextAuctionId++;
        
        auctions[auctionId] = Auction({
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            minBidIncrement: minBidIncrement,
            highestBid: 0,
            startTime: uint64(block.timestamp),
            endTime: uint64(block.timestamp + duration),
            highestBidder: address(0),
            ended: false,
            nftMinted: false,
            metadataId: auctionId
        });
        
        emit AuctionCreated(auctionId, startingPrice);
        return auctionId;
    }
    
    function setAuctionMetadata(
        uint256 auctionId,
        string memory lotNumber,
        string memory title,
        string memory titleZh,
        string memory dynasty,
        string memory tokenURI
    ) external onlyAuthorizedSeller {
        require(auctionId < nextAuctionId, "Invalid auction");
        require(!auctions[auctionId].ended, "Auction ended");
        
        auctionMetadata[auctionId] = AuctionMetadata({
            lotNumber: lotNumber,
            title: title,
            titleZh: titleZh,
            dynasty: dynasty,
            tokenURI: tokenURI
        });
    }
    
    function placeBid(uint256 auctionId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp < auction.endTime, "Ended");
        require(!auction.ended, "Already ended");
        
        uint256 minBid = auction.highestBid == 0 
            ? auction.startingPrice 
            : auction.highestBid + auction.minBidIncrement;
            
        require(msg.value >= minBid, "Bid too low");
        
        if (auction.highestBidder != address(0)) {
            pendingReturns[auctionId][auction.highestBidder] += auction.highestBid;
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = uint128(msg.value);
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
        
        if (auction.endTime - block.timestamp < 5 minutes) {
            auction.endTime += 5 minutes;
        }
    }
    
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.endTime, "Not ended");
        require(!auction.ended, "Already ended");
        
        auction.ended = true;
        
        if (auction.highestBidder != address(0) && auction.highestBid >= auction.reservePrice) {
            uint256 platformFee = (uint256(auction.highestBid) * platformFeePercentage) / 10000;
            uint256 sellerProceeds = uint256(auction.highestBid) - platformFee;
            
            payable(feeRecipient).transfer(platformFee);
            payable(owner()).transfer(sellerProceeds);
            
            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
            
            _mintNFT(auctionId);
        } else {
            if (auction.highestBidder != address(0)) {
                pendingReturns[auctionId][auction.highestBidder] += auction.highestBid;
            }
        }
    }
    
    function _mintNFT(uint256 auctionId) private {
        Auction storage auction = auctions[auctionId];
        AuctionMetadata storage metadata = auctionMetadata[auctionId];
        
        require(!auction.nftMinted, "Already minted");
        
        nftContract.mintCeramic(
            auction.highestBidder,
            metadata.lotNumber,
            metadata.title,
            metadata.titleZh,
            metadata.dynasty,
            metadata.tokenURI
        );
        
        auction.nftMinted = true;
    }
    
    function withdraw(uint256 auctionId) external nonReentrant {
        uint256 amount = pendingReturns[auctionId][msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        pendingReturns[auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    modifier onlyAuthorizedSeller() {
        require(authorizedSellers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
}