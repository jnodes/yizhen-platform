// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ComplianceRegistry
 * @dev On-chain compliance registry for Yizhen platform
 * Manages KYC status, risk scores, and transaction permissions
 */
contract ComplianceRegistry is AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER");
    bytes32 public constant RISK_MONITOR_ROLE = keccak256("RISK_MONITOR");
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER");

    // Compliance statuses
    enum ComplianceStatus {
        UNKNOWN,
        PENDING,
        APPROVED,
        CONDITIONAL,
        REVIEW,
        BLOCKED
    }

    enum KYCLevel {
        NONE,
        BASIC,
        ENHANCED,
        INSTITUTIONAL
    }

    // User compliance data
    struct ComplianceData {
        ComplianceStatus status;
        KYCLevel kycLevel;
        uint256 riskScore; // 0-10000 (basis points)
        uint256 lastUpdated;
        uint256 kycExpiry;
        string jurisdiction;
        bool sanctioned;
        mapping(string => bool) flags; // Additional compliance flags
    }

    // Transaction limits based on KYC level
    struct TransactionLimits {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 perTransactionLimit;
    }

    // Events
    event ComplianceUpdated(
        address indexed user,
        ComplianceStatus status,
        uint256 riskScore,
        uint256 timestamp
    );
    
    event KYCUpdated(
        address indexed user,
        KYCLevel level,
        uint256 expiry,
        address indexed provider
    );
    
    event RiskAlert(
        address indexed user,
        string alertType,
        uint256 severity,
        uint256 timestamp
    );
    
    event TransactionReviewed(
        address indexed user,
        bytes32 indexed transactionId,
        bool approved,
        string reason
    );

    // State variables
    mapping(address => ComplianceData) private userCompliance;
    mapping(KYCLevel => TransactionLimits) public transactionLimits;
    mapping(address => uint256) public dailyVolume;
    mapping(address => uint256) public monthlyVolume;
    mapping(address => uint256) public lastActivityDate;
    
    // Sanctions list
    mapping(address => bool) public sanctionsList;
    mapping(string => bool) public restrictedJurisdictions;
    
    // Risk parameters
    uint256 public highRiskThreshold = 7000; // 70%
    uint256 public mediumRiskThreshold = 5000; // 50%
    
    // Time windows
    uint256 public constant DAY = 86400;
    uint256 public constant MONTH = 2592000;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
        
        // Initialize transaction limits
        _setDefaultLimits();
        
        // Initialize restricted jurisdictions
        _initializeRestrictedJurisdictions();
    }

    /**
     * @dev Update user compliance status
     * @param user Address of the user
     * @param status New compliance status
     * @param riskScore Risk score in basis points
     */
    function updateCompliance(
        address user,
        ComplianceStatus status,
        uint256 riskScore
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(riskScore <= 10000, "Invalid risk score");
        
        ComplianceData storage data = userCompliance[user];
        data.status = status;
        data.riskScore = riskScore;
        data.lastUpdated = block.timestamp;
        
        emit ComplianceUpdated(user, status, riskScore, block.timestamp);
        
        // Auto-block if high risk
        if (riskScore >= highRiskThreshold && status != ComplianceStatus.BLOCKED) {
            data.status = ComplianceStatus.BLOCKED;
            emit RiskAlert(user, "HIGH_RISK_AUTO_BLOCK", 3, block.timestamp);
        }
    }

    /**
     * @dev Update user KYC status
     * @param user Address of the user
     * @param level KYC level
     * @param expiryDays Days until KYC expires
     */
    function updateKYC(
        address user,
        KYCLevel level,
        uint256 expiryDays
    ) external onlyRole(KYC_PROVIDER_ROLE) {
        ComplianceData storage data = userCompliance[user];
        data.kycLevel = level;
        data.kycExpiry = block.timestamp + (expiryDays * DAY);
        
        // Update compliance status based on KYC
        if (level >= KYCLevel.BASIC && data.status == ComplianceStatus.PENDING) {
            data.status = ComplianceStatus.APPROVED;
        }
        
        emit KYCUpdated(user, level, data.kycExpiry, msg.sender);
    }

    /**
     * @dev Check if transaction is compliant
     * @param user Address of the user
     * @param amount Transaction amount
     * @return approved Whether transaction is approved
     * @return reason Reason if not approved
     */
    function checkTransaction(
        address user,
        uint256 amount
    ) external view returns (bool approved, string memory reason) {
        ComplianceData storage data = userCompliance[user];
        
        // Check sanctions
        if (data.sanctioned || sanctionsList[user]) {
            return (false, "User is sanctioned");
        }
        
        // Check compliance status
        if (data.status == ComplianceStatus.BLOCKED) {
            return (false, "User is blocked");
        }
        
        if (data.status == ComplianceStatus.UNKNOWN) {
            return (false, "Compliance check required");
        }
        
        // Check KYC expiry
        if (data.kycExpiry > 0 && block.timestamp > data.kycExpiry) {
            return (false, "KYC expired");
        }
        
        // Check transaction limits
        TransactionLimits memory limits = transactionLimits[data.kycLevel];
        
        if (amount > limits.perTransactionLimit) {
            return (false, "Exceeds per-transaction limit");
        }
        
        // Check daily limit
        uint256 newDailyVolume = _getCurrentDailyVolume(user) + amount;
        if (newDailyVolume > limits.dailyLimit) {
            return (false, "Exceeds daily limit");
        }
        
        // Check monthly limit
        uint256 newMonthlyVolume = _getCurrentMonthlyVolume(user) + amount;
        if (newMonthlyVolume > limits.monthlyLimit) {
            return (false, "Exceeds monthly limit");
        }
        
        // Check risk-based restrictions
        if (data.riskScore >= highRiskThreshold) {
            return (false, "High risk - manual review required");
        }
        
        return (true, "Approved");
    }

    /**
     * @dev Record transaction for limit tracking
     * @param user Address of the user
     * @param amount Transaction amount
     */
    function recordTransaction(
        address user,
        uint256 amount
    ) external onlyRole(RISK_MONITOR_ROLE) {
        _updateVolumes(user, amount);
    }

    /**
     * @dev Add address to sanctions list
     * @param user Address to sanction
     */
    function addToSanctionsList(address user) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        sanctionsList[user] = true;
        userCompliance[user].sanctioned = true;
        userCompliance[user].status = ComplianceStatus.BLOCKED;
        
        emit ComplianceUpdated(user, ComplianceStatus.BLOCKED, 10000, block.timestamp);
        emit RiskAlert(user, "SANCTIONS_MATCH", 3, block.timestamp);
    }

    /**
     * @dev Remove address from sanctions list
     * @param user Address to remove
     */
    function removeFromSanctionsList(address user) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        sanctionsList[user] = false;
        userCompliance[user].sanctioned = false;
        
        emit RiskAlert(user, "SANCTIONS_CLEARED", 1, block.timestamp);
    }

    /**
     * @dev Set user jurisdiction
     * @param user Address of the user
     * @param jurisdiction Jurisdiction code
     */
    function setJurisdiction(
        address user,
        string memory jurisdiction
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        userCompliance[user].jurisdiction = jurisdiction;
        
        // Auto-block if restricted jurisdiction
        if (restrictedJurisdictions[jurisdiction]) {
            userCompliance[user].status = ComplianceStatus.BLOCKED;
            emit RiskAlert(user, "RESTRICTED_JURISDICTION", 3, block.timestamp);
        }
    }

    /**
     * @dev Get user compliance data
     * @param user Address of the user
     */
    function getComplianceData(address user) external view returns (
        ComplianceStatus status,
        KYCLevel kycLevel,
        uint256 riskScore,
        uint256 lastUpdated,
        uint256 kycExpiry,
        string memory jurisdiction,
        bool sanctioned
    ) {
        ComplianceData storage data = userCompliance[user];
        return (
            data.status,
            data.kycLevel,
            data.riskScore,
            data.lastUpdated,
            data.kycExpiry,
            data.jurisdiction,
            data.sanctioned
        );
    }

    /**
     * @dev Get user transaction limits
     * @param user Address of the user
     */
    function getUserLimits(address user) external view returns (
        uint256 dailyLimit,
        uint256 monthlyLimit,
        uint256 perTransactionLimit,
        uint256 dailyUsed,
        uint256 monthlyUsed
    ) {
        KYCLevel level = userCompliance[user].kycLevel;
        TransactionLimits memory limits = transactionLimits[level];
        
        return (
            limits.dailyLimit,
            limits.monthlyLimit,
            limits.perTransactionLimit,
            _getCurrentDailyVolume(user),
            _getCurrentMonthlyVolume(user)
        );
    }

    /**
     * @dev Update transaction limits for KYC level
     */
    function updateTransactionLimits(
        KYCLevel level,
        uint256 daily,
        uint256 monthly,
        uint256 perTx
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        transactionLimits[level] = TransactionLimits({
            dailyLimit: daily,
            monthlyLimit: monthly,
            perTransactionLimit: perTx
        });
    }

    /**
     * @dev Batch update compliance data
     */
    function batchUpdateCompliance(
        address[] calldata users,
        ComplianceStatus[] calldata statuses,
        uint256[] calldata riskScores
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(
            users.length == statuses.length && users.length == riskScores.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < users.length; i++) {
            ComplianceData storage data = userCompliance[users[i]];
            data.status = statuses[i];
            data.riskScore = riskScores[i];
            data.lastUpdated = block.timestamp;
            
            emit ComplianceUpdated(users[i], statuses[i], riskScores[i], block.timestamp);
        }
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _unpause();
    }

    // Internal functions
    function _getCurrentDailyVolume(address user) private view returns (uint256) {
        if (block.timestamp > lastActivityDate[user] + DAY) {
            return 0;
        }
        return dailyVolume[user];
    }

    function _getCurrentMonthlyVolume(address user) private view returns (uint256) {
        if (block.timestamp > lastActivityDate[user] + MONTH) {
            return 0;
        }
        return monthlyVolume[user];
    }

    function _updateVolumes(address user, uint256 amount) private {
        uint256 currentTime = block.timestamp;
        
        // Reset daily volume if new day
        if (currentTime > lastActivityDate[user] + DAY) {
            dailyVolume[user] = amount;
        } else {
            dailyVolume[user] += amount;
        }
        
        // Reset monthly volume if new month
        if (currentTime > lastActivityDate[user] + MONTH) {
            monthlyVolume[user] = amount;
        } else {
            monthlyVolume[user] += amount;
        }
        
        lastActivityDate[user] = currentTime;
    }

    function _setDefaultLimits() private {
        // No KYC - minimal limits
        transactionLimits[KYCLevel.NONE] = TransactionLimits({
            dailyLimit: 1000 * 1e6, // $1,000 USDT
            monthlyLimit: 5000 * 1e6, // $5,000 USDT
            perTransactionLimit: 500 * 1e6 // $500 USDT
        });
        
        // Basic KYC
        transactionLimits[KYCLevel.BASIC] = TransactionLimits({
            dailyLimit: 10000 * 1e6, // $10,000 USDT
            monthlyLimit: 50000 * 1e6, // $50,000 USDT
            perTransactionLimit: 5000 * 1e6 // $5,000 USDT
        });
        
        // Enhanced KYC
        transactionLimits[KYCLevel.ENHANCED] = TransactionLimits({
            dailyLimit: 100000 * 1e6, // $100,000 USDT
            monthlyLimit: 1000000 * 1e6, // $1,000,000 USDT
            perTransactionLimit: 50000 * 1e6 // $50,000 USDT
        });
        
        // Institutional
        transactionLimits[KYCLevel.INSTITUTIONAL] = TransactionLimits({
            dailyLimit: 10000000 * 1e6, // $10,000,000 USDT
            monthlyLimit: 100000000 * 1e6, // $100,000,000 USDT
            perTransactionLimit: 5000000 * 1e6 // $5,000,000 USDT
        });
    }

    function _initializeRestrictedJurisdictions() private {
        restrictedJurisdictions["KP"] = true; // North Korea
        restrictedJurisdictions["IR"] = true; // Iran
        restrictedJurisdictions["CU"] = true; // Cuba
        restrictedJurisdictions["SY"] = true; // Syria
        restrictedJurisdictions["RU"] = true; // Russia (sanctions-related)
    }
}

/**
 * @title YizhenAuctionWithCompliance
 * @dev Enhanced auction contract with compliance integration
 */
contract YizhenAuctionWithCompliance is ReentrancyGuard, Pausable, AccessControl {
    ComplianceRegistry public immutable complianceRegistry;
    
    // Original auction variables (simplified for example)
    struct Auction {
        uint256 artifactId;
        address seller;
        uint256 startPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool ended;
    }
    
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;
    
    // Events
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event ComplianceCheckFailed(address indexed user, string reason);
    
    constructor(address _complianceRegistry) {
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Place bid with compliance check
     */
    function placeBid(uint256 auctionId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.value > auction.currentBid, "Bid too low");
        
        // Compliance check
        (bool compliant, string memory reason) = complianceRegistry.checkTransaction(
            msg.sender,
            msg.value
        );
        
        if (!compliant) {
            revert(string(abi.encodePacked("Compliance check failed: ", reason)));
        }
        
        // Record transaction for compliance tracking
        _recordComplianceTransaction(msg.sender, msg.value);
        
        // Process bid
        if (auction.currentBidder != address(0)) {
            // Refund previous bidder
            payable(auction.currentBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }
    
    /**
     * @dev Create auction with seller compliance check
     */
    function createAuction(
        uint256 artifactId,
        uint256 startPrice,
        uint256 duration
    ) external whenNotPaused returns (uint256) {
        // Check seller compliance
        (bool compliant, string memory reason) = complianceRegistry.checkTransaction(
            msg.sender,
            0 // Just checking status, not amount
        );
        
        require(compliant, string(abi.encodePacked("Seller not compliant: ", reason)));
        
        uint256 auctionId = auctionCounter++;
        auctions[auctionId] = Auction({
            artifactId: artifactId,
            seller: msg.sender,
            startPrice: startPrice,
            currentBid: startPrice,
            currentBidder: address(0),
            endTime: block.timestamp + duration,
            ended: false
        });
        
        return auctionId;
    }
    
    function _recordComplianceTransaction(address user, uint256 amount) private {
        // Only compliance officers can record transactions
        // In production, this would be done through a more sophisticated mechanism
        try complianceRegistry.recordTransaction(user, amount) {
            // Transaction recorded
        } catch {
            // Log error but don't block transaction
            emit ComplianceCheckFailed(user, "Failed to record transaction");
        }
    }
}

/**
 * @title ComplianceOracle
 * @dev Oracle for off-chain compliance data
 */
contract ComplianceOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE");
    
    struct ComplianceRequest {
        address user;
        address requester;
        uint256 timestamp;
        bool fulfilled;
        bytes32 dataHash;
    }
    
    mapping(uint256 => ComplianceRequest) public requests;
    uint256 public requestCounter;
    
    event ComplianceRequested(uint256 indexed requestId, address indexed user);
    event ComplianceFulfilled(uint256 indexed requestId, bytes32 dataHash);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    function requestCompliance(address user) external returns (uint256) {
        uint256 requestId = requestCounter++;
        
        requests[requestId] = ComplianceRequest({
            user: user,
            requester: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false,
            dataHash: bytes32(0)
        });
        
        emit ComplianceRequested(requestId, user);
        return requestId;
    }
    
    function fulfillCompliance(
        uint256 requestId,
        bytes32 dataHash,
        bytes calldata signature
    ) external onlyRole(ORACLE_ROLE) {
        ComplianceRequest storage request = requests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        // Verify signature in production
        // bytes32 messageHash = keccak256(abi.encodePacked(requestId, dataHash));
        // address signer = messageHash.toEthSignedMessageHash().recover(signature);
        // require(hasRole(ORACLE_ROLE, signer), "Invalid signature");
        
        request.fulfilled = true;
        request.dataHash = dataHash;
        
        emit ComplianceFulfilled(requestId, dataHash);
    }
}
