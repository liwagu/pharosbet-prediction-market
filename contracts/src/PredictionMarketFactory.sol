// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PredictionMarket.sol";

/**
 * @title PredictionMarketFactory
 * @notice Factory contract that deploys and tracks all prediction markets
 * @dev Deployed once on Pharos Network, creates PredictionMarket instances
 * 
 * Key Features:
 * - Permissionless market creation (anyone can create a market)
 * - Registry of all deployed markets
 * - Oracle management (admin can set default oracle)
 * - Fee collection from all markets
 */
contract PredictionMarketFactory {
    // ============ State Variables ============
    
    address public admin;
    address public defaultOracle;
    
    // Registry
    address[] public allMarkets;
    mapping(address => bool) public isMarket;
    mapping(address => address[]) public userMarkets;
    
    // Stats
    uint256 public totalMarketsCreated;
    
    // ============ Events ============
    
    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string question,
        string category,
        uint256 endTime,
        uint256 marketIndex
    );
    
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    
    // ============ Constructor ============
    
    constructor(address _defaultOracle) {
        admin = msg.sender;
        defaultOracle = _defaultOracle;
    }
    
    // ============ Market Creation ============
    
    /**
     * @notice Create a new prediction market
     * @param _question The YES/NO question for the market
     * @param _description Detailed resolution criteria
     * @param _category Market category (crypto, politics, sports, etc.)
     * @param _endTime Unix timestamp when the market ends
     */
    function createMarket(
        string calldata _question,
        string calldata _description,
        string calldata _category,
        uint256 _endTime
    ) external returns (address) {
        require(bytes(_question).length > 0, "Question required");
        require(bytes(_question).length <= 500, "Question too long");
        require(_endTime > block.timestamp + 1 hours, "End time too soon");
        
        // Deploy new market contract
        PredictionMarket market = new PredictionMarket();
        
        // Initialize the market
        market.initialize(
            msg.sender,
            defaultOracle,
            _question,
            _description,
            _category,
            _endTime
        );
        
        // Register the market
        address marketAddress = address(market);
        allMarkets.push(marketAddress);
        isMarket[marketAddress] = true;
        userMarkets[msg.sender].push(marketAddress);
        totalMarketsCreated++;
        
        emit MarketCreated(
            marketAddress,
            msg.sender,
            _question,
            _category,
            _endTime,
            totalMarketsCreated - 1
        );
        
        return marketAddress;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }
    
    /**
     * @notice Get a page of markets (for pagination)
     * @param offset Starting index
     * @param limit Number of markets to return
     */
    function getMarkets(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 end = offset + limit;
        if (end > allMarkets.length) {
            end = allMarkets.length;
        }
        
        uint256 length = end - offset;
        address[] memory markets = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            markets[i] = allMarkets[offset + i];
        }
        
        return markets;
    }
    
    /**
     * @notice Get all markets created by a user
     */
    function getUserMarkets(address user) external view returns (address[] memory) {
        return userMarkets[user];
    }
    
    // ============ Admin Functions ============
    
    function setOracle(address _newOracle) external {
        require(msg.sender == admin, "Only admin");
        address oldOracle = defaultOracle;
        defaultOracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }
    
    function transferAdmin(address _newAdmin) external {
        require(msg.sender == admin, "Only admin");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(oldAdmin, _newAdmin);
    }
}
