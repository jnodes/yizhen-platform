// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title YizhenCeramicsNFT
 * @dev ERC721 NFT contract for Chinese ceramics. Each NFT represents ownership of a physical ceramic piece.
 */
contract YizhenCeramicsNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Struct to store ceramic metadata
    struct Ceramic {
        string lotNumber;
        string title;
        string titleZh;
        string dynasty;
        uint256 mintedAt;
        bool shipped;
        string trackingNumber;
        address originalMinter;
    }
    
    // Mapping from token ID to ceramic details
    mapping(uint256 => Ceramic) public ceramics;
    
    // Mapping to track authenticity certificates
    mapping(uint256 => string) public authenticityCertificates;
    
    // Shipping address storage
    mapping(uint256 => string) public shippingAddresses;
    
    // Events
    event CeramicMinted(uint256 indexed tokenId, string lotNumber, address indexed owner);
    event ShippingAddressUpdated(uint256 indexed tokenId, address indexed owner);
    event ItemShipped(uint256 indexed tokenId, string trackingNumber);
    event AuthenticityVerified(uint256 indexed tokenId, string certificateHash);
    
    // Only auction contract can mint
    address public auctionContract;
    
    modifier onlyAuctionContract() {
        require(msg.sender == auctionContract, "Only auction contract can mint");
        _;
    }
    
    constructor() ERC721("Yizhen Ceramics Collection", "YIZHEN") Ownable(msg.sender) {}
    
    /**
     * @dev Set the auction contract address
     */
    function setAuctionContract(address _auctionContract) external onlyOwner {
        require(_auctionContract != address(0), "Invalid auction contract");
        auctionContract = _auctionContract;
    }
    
    /**
     * @dev Mint a new ceramic NFT (only callable by auction contract)
     */
    function mintCeramic(
        address winner,
        string memory lotNumber,
        string memory title,
        string memory titleZh,
        string memory dynasty,
        string memory metadataURI
    ) external onlyAuctionContract returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(winner, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        ceramics[tokenId] = Ceramic({
            lotNumber: lotNumber,
            title: title,
            titleZh: titleZh,
            dynasty: dynasty,
            mintedAt: block.timestamp,
            shipped: false,
            trackingNumber: "",
            originalMinter: winner
        });
        
        emit CeramicMinted(tokenId, lotNumber, winner);
        return tokenId;
    }
    
    /**
     * @dev Update shipping address for a ceramic
     */
    function updateShippingAddress(uint256 tokenId, string memory shippingAddress) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!ceramics[tokenId].shipped, "Already shipped");
        require(bytes(shippingAddress).length > 0, "Invalid address");
        
        shippingAddresses[tokenId] = shippingAddress;
        emit ShippingAddressUpdated(tokenId, msg.sender);
    }
    
    /**
     * @dev Mark item as shipped (only owner)
     */
    function markAsShipped(uint256 tokenId, string memory trackingNumber) external onlyOwner {
        // Check token exists by verifying it has an owner
        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner != address(0), "Token does not exist");
        require(!ceramics[tokenId].shipped, "Already shipped");
        require(bytes(shippingAddresses[tokenId]).length > 0, "No shipping address");
        
        ceramics[tokenId].shipped = true;
        ceramics[tokenId].trackingNumber = trackingNumber;
        
        emit ItemShipped(tokenId, trackingNumber);
    }
    
    /**
     * @dev Add authenticity certificate
     */
    function addAuthenticityCertificate(uint256 tokenId, string memory certificateHash) 
        external 
        onlyOwner 
    {
        // Check token exists by verifying it has an owner
        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner != address(0), "Token does not exist");
        authenticityCertificates[tokenId] = certificateHash;
        emit AuthenticityVerified(tokenId, certificateHash);
    }
    
    /**
     * @dev Get full ceramic details
     */
    function getCeramicDetails(uint256 tokenId) 
        external 
        view 
        returns (
            Ceramic memory ceramic,
            string memory metadataURI,
            string memory shippingAddress,
            string memory certificate
        ) 
    {
        // Check token exists by trying to get its URI
        string memory uri = tokenURI(tokenId); // This will revert if token doesn't exist
        return (
            ceramics[tokenId],
            uri,
            shippingAddresses[tokenId],
            authenticityCertificates[tokenId]
        );
    }
    
    /**
     * @dev Check if a token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Override required functions
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Prevent transfers while item is not shipped
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning
        if (from == address(0) || to == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        // Optional: Uncomment to prevent transfers before shipping
        // require(ceramics[tokenId].shipped, "Cannot transfer before shipping");
        
        return super._update(to, tokenId, auth);
    }
}
