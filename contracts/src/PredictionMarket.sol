// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionMarket
 * @notice A single binary prediction market with built-in CPMM (Constant Product Market Maker)
 * @dev Deployed by PredictionMarketFactory for each new market
 * 
 * Architecture:
 * - Each market is a YES/NO binary outcome
 * - Uses Constant Product AMM (x * y = k) for automated pricing
 * - Oracle resolves the market after the end date
 * - Winners can claim proportional share of the prize pool
 */
contract PredictionMarket {
    // ============ State Variables ============
    
    address public factory;
    address public creator;
    address public oracle;
    
    string public question;
    string public description;
    string public category;
    
    uint256 public endTime;
    uint256 public createdAt;
    
    // AMM State (Constant Product: yesPool * noPool = k)
    uint256 public yesPool;
    uint256 public noPool;
    uint256 public constant INITIAL_LIQUIDITY = 1000 ether;
    uint256 public constant FEE_BPS = 200; // 2% fee
    uint256 public constant BPS = 10000;
    
    // Market State
    enum MarketStatus { Active, Paused, Resolved }
    MarketStatus public status;
    
    enum Outcome { Unresolved, Yes, No }
    Outcome public resolvedOutcome;
    
    // User Positions
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public hasClaimed;
    
    // Stats
    uint256 public totalVolume;
    uint256 public totalFees;
    uint256 public participantCount;
    mapping(address => bool) public isParticipant;
    
    // Share tracking for accurate payout calculation
    uint256 public totalYesSharesMinted;
    uint256 public totalNoSharesMinted;
    
    // ============ Events ============
    
    event SharesBought(
        address indexed buyer,
        bool isYes,
        uint256 amount,
        uint256 shares,
        uint256 newYesPrice,
        uint256 newNoPrice
    );
    
    event SharesSold(
        address indexed seller,
        bool isYes,
        uint256 shares,
        uint256 payout,
        uint256 newYesPrice,
        uint256 newNoPrice
    );
    
    event MarketResolved(Outcome outcome, uint256 timestamp);
    event WinningsClaimed(address indexed user, uint256 amount);
    event LiquidityAdded(address indexed provider, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyActive() {
        require(status == MarketStatus.Active, "Market not active");
        require(block.timestamp < endTime, "Market ended");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        factory = msg.sender;
    }
    
    /**
     * @notice Initialize the market (called by factory)
     */
    function initialize(
        address _creator,
        address _oracle,
        string calldata _question,
        string calldata _description,
        string calldata _category,
        uint256 _endTime
    ) external onlyFactory {
        require(_endTime > block.timestamp, "End time must be future");
        
        creator = _creator;
        oracle = _oracle;
        question = _question;
        description = _description;
        category = _category;
        endTime = _endTime;
        createdAt = block.timestamp;
        status = MarketStatus.Active;
        
        // Initialize AMM with equal pools (50/50 probability)
        yesPool = INITIAL_LIQUIDITY;
        noPool = INITIAL_LIQUIDITY;
    }
    
    // ============ Trading Functions ============
    
    /**
     * @notice Buy YES shares using native token (PHAR)
     * @dev Uses CPMM formula: dy = y - (x * y) / (x + dx)
     */
    function buyYes() external payable onlyActive {
        require(msg.value > 0, "Must send PHAR");
        
        uint256 fee = (msg.value * FEE_BPS) / BPS;
        uint256 amountAfterFee = msg.value - fee;
        totalFees += fee;
        
        // CPMM: Calculate shares received
        uint256 k = yesPool * noPool;
        uint256 newNoPool = noPool + amountAfterFee;
        uint256 newYesPool = k / newNoPool;
        uint256 sharesOut = yesPool - newYesPool;
        
        require(sharesOut > 0, "Insufficient output");
        
        yesPool = newYesPool;
        noPool = newNoPool;
        yesShares[msg.sender] += sharesOut;
        totalYesSharesMinted += sharesOut;
        totalVolume += msg.value;
        
        _trackParticipant(msg.sender);
        
        emit SharesBought(
            msg.sender,
            true,
            msg.value,
            sharesOut,
            getYesPrice(),
            getNoPrice()
        );
    }
    
    /**
     * @notice Buy NO shares using native token (PHAR)
     */
    function buyNo() external payable onlyActive {
        require(msg.value > 0, "Must send PHAR");
        
        uint256 fee = (msg.value * FEE_BPS) / BPS;
        uint256 amountAfterFee = msg.value - fee;
        totalFees += fee;
        
        // CPMM: Calculate shares received
        uint256 k = yesPool * noPool;
        uint256 newYesPool = yesPool + amountAfterFee;
        uint256 newNoPool = k / newYesPool;
        uint256 sharesOut = noPool - newNoPool;
        
        require(sharesOut > 0, "Insufficient output");
        
        yesPool = newYesPool;
        noPool = newNoPool;
        noShares[msg.sender] += sharesOut;
        totalNoSharesMinted += sharesOut;
        totalVolume += msg.value;
        
        _trackParticipant(msg.sender);
        
        emit SharesBought(
            msg.sender,
            false,
            msg.value,
            sharesOut,
            getYesPrice(),
            getNoPrice()
        );
    }
    
    /**
     * @notice Sell YES shares back to the AMM
     */
    function sellYes(uint256 sharesToSell) external onlyActive {
        require(yesShares[msg.sender] >= sharesToSell, "Insufficient shares");
        
        // CPMM: Calculate payout
        uint256 k = yesPool * noPool;
        uint256 newYesPool = yesPool + sharesToSell;
        uint256 newNoPool = k / newYesPool;
        uint256 payout = noPool - newNoPool;
        
        uint256 fee = (payout * FEE_BPS) / BPS;
        uint256 payoutAfterFee = payout - fee;
        totalFees += fee;
        
        yesPool = newYesPool;
        noPool = newNoPool;
        yesShares[msg.sender] -= sharesToSell;
        totalYesSharesMinted -= sharesToSell;
        
        payable(msg.sender).transfer(payoutAfterFee);
        
        emit SharesSold(
            msg.sender,
            true,
            sharesToSell,
            payoutAfterFee,
            getYesPrice(),
            getNoPrice()
        );
    }
    
    /**
     * @notice Sell NO shares back to the AMM
     */
    function sellNo(uint256 sharesToSell) external onlyActive {
        require(noShares[msg.sender] >= sharesToSell, "Insufficient shares");
        
        uint256 k = yesPool * noPool;
        uint256 newNoPool = noPool + sharesToSell;
        uint256 newYesPool = k / newNoPool;
        uint256 payout = yesPool - newYesPool;
        
        uint256 fee = (payout * FEE_BPS) / BPS;
        uint256 payoutAfterFee = payout - fee;
        totalFees += fee;
        
        yesPool = newYesPool;
        noPool = newNoPool;
        noShares[msg.sender] -= sharesToSell;
        totalNoSharesMinted -= sharesToSell;
        
        payable(msg.sender).transfer(payoutAfterFee);
        
        emit SharesSold(
            msg.sender,
            false,
            sharesToSell,
            payoutAfterFee,
            getYesPrice(),
            getNoPrice()
        );
    }
    
    // ============ Resolution ============
    
    /**
     * @notice Resolve the market (oracle only)
     * @param _outcome 1 = Yes, 2 = No
     */
    function resolve(Outcome _outcome) external onlyOracle {
        // Note: endTime check removed for hackathon demo (oracle is trusted)
        require(status == MarketStatus.Active, "Already resolved");
        require(_outcome == Outcome.Yes || _outcome == Outcome.No, "Invalid outcome");
        
        resolvedOutcome = _outcome;
        status = MarketStatus.Resolved;
        
        emit MarketResolved(_outcome, block.timestamp);
    }
    
    /**
     * @notice Claim winnings after market resolution
     */
    function claimWinnings() external {
        require(status == MarketStatus.Resolved, "Not resolved");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        uint256 winningShares;
        if (resolvedOutcome == Outcome.Yes) {
            winningShares = yesShares[msg.sender];
        } else {
            winningShares = noShares[msg.sender];
        }
        
        require(winningShares > 0, "No winning shares");
        
        hasClaimed[msg.sender] = true;
        
        // Calculate proportional payout from the pool
        uint256 totalPool = address(this).balance;
        uint256 totalWinningShares = resolvedOutcome == Outcome.Yes ? 
            _getTotalYesShares() : _getTotalNoShares();
        
        uint256 payout = (totalPool * winningShares) / totalWinningShares;
        
        payable(msg.sender).transfer(payout);
        
        emit WinningsClaimed(msg.sender, payout);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get current YES price (0-100 representing probability %)
     */
    function getYesPrice() public view returns (uint256) {
        uint256 total = yesPool + noPool;
        if (total == 0) return 50;
        return (noPool * 100) / total;
    }
    
    /**
     * @notice Get current NO price (0-100 representing probability %)
     */
    function getNoPrice() public view returns (uint256) {
        uint256 total = yesPool + noPool;
        if (total == 0) return 50;
        return (yesPool * 100) / total;
    }
    
    /**
     * @notice Estimate shares received for a given buy amount
     */
    function estimateBuyYes(uint256 amount) external view returns (uint256) {
        uint256 fee = (amount * FEE_BPS) / BPS;
        uint256 amountAfterFee = amount - fee;
        uint256 k = yesPool * noPool;
        uint256 newNoPool = noPool + amountAfterFee;
        uint256 newYesPool = k / newNoPool;
        return yesPool - newYesPool;
    }
    
    function estimateBuyNo(uint256 amount) external view returns (uint256) {
        uint256 fee = (amount * FEE_BPS) / BPS;
        uint256 amountAfterFee = amount - fee;
        uint256 k = yesPool * noPool;
        uint256 newYesPool = yesPool + amountAfterFee;
        uint256 newNoPool = k / newYesPool;
        return noPool - newNoPool;
    }
    
    /**
     * @notice Get market info as a struct
     */
    function getMarketInfo() external view returns (
        string memory _question,
        string memory _description,
        string memory _category,
        address _creator,
        uint256 _endTime,
        uint256 _yesPrice,
        uint256 _noPrice,
        uint256 _totalVolume,
        uint256 _participantCount,
        MarketStatus _status,
        Outcome _resolvedOutcome
    ) {
        return (
            question,
            description,
            category,
            creator,
            endTime,
            getYesPrice(),
            getNoPrice(),
            totalVolume,
            participantCount,
            status,
            resolvedOutcome
        );
    }
    
    // ============ Internal ============
    
    function _trackParticipant(address user) internal {
        if (!isParticipant[user]) {
            isParticipant[user] = true;
            participantCount++;
        }
    }
    
    function _getTotalYesShares() internal view returns (uint256) {
        return totalYesSharesMinted;
    }
    
    function _getTotalNoShares() internal view returns (uint256) {
        return totalNoSharesMinted;
    }
    
    // Allow contract to receive PHAR
    receive() external payable {}
}
