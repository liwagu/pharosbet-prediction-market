// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PredictionMarket.sol";

/**
 * @title SimpleOracle
 * @notice Oracle contract for resolving prediction markets
 * @dev In production, integrate with Chainlink, Pyth, or other oracle networks
 * 
 * Architecture:
 * - Multi-sig style: requires multiple reporters to agree on outcome
 * - Dispute period: allows challenges before finalization
 * - Extensible: designed to be replaced with decentralized oracle integration
 * 
 * Pharos Integration:
 * - Can leverage Pharos's low-latency for faster oracle updates
 * - Future: integrate with Pharos-native oracle solutions
 */
contract SimpleOracle {
    // ============ State Variables ============
    
    address public admin;
    
    // Reporters who can submit outcomes
    mapping(address => bool) public isReporter;
    uint256 public reporterCount;
    uint256 public requiredConfirmations;
    
    // Resolution tracking
    struct Resolution {
        mapping(address => PredictionMarket.Outcome) votes;
        uint256 yesVotes;
        uint256 noVotes;
        bool finalized;
        uint256 disputeDeadline;
    }
    
    mapping(address => Resolution) public resolutions;
    
    uint256 public constant DISPUTE_PERIOD = 1 hours;
    
    // ============ Events ============
    
    event OutcomeReported(address indexed market, address indexed reporter, PredictionMarket.Outcome outcome);
    event MarketFinalized(address indexed market, PredictionMarket.Outcome outcome);
    event ReporterAdded(address indexed reporter);
    event ReporterRemoved(address indexed reporter);
    event DisputeRaised(address indexed market, address indexed disputer);
    
    // ============ Constructor ============
    
    constructor(uint256 _requiredConfirmations) {
        admin = msg.sender;
        isReporter[msg.sender] = true;
        reporterCount = 1;
        requiredConfirmations = _requiredConfirmations;
    }
    
    // ============ Reporter Management ============
    
    function addReporter(address _reporter) external {
        require(msg.sender == admin, "Only admin");
        require(!isReporter[_reporter], "Already reporter");
        isReporter[_reporter] = true;
        reporterCount++;
        emit ReporterAdded(_reporter);
    }
    
    function removeReporter(address _reporter) external {
        require(msg.sender == admin, "Only admin");
        require(isReporter[_reporter], "Not reporter");
        require(_reporter != admin, "Cannot remove admin");
        isReporter[_reporter] = false;
        reporterCount--;
        emit ReporterRemoved(_reporter);
    }
    
    // ============ Resolution ============
    
    /**
     * @notice Report an outcome for a market
     * @param _market Address of the prediction market
     * @param _outcome 1 = Yes, 2 = No
     */
    function reportOutcome(
        address payable _market,
        PredictionMarket.Outcome _outcome
    ) external {
        require(isReporter[msg.sender], "Not a reporter");
        require(_outcome == PredictionMarket.Outcome.Yes || _outcome == PredictionMarket.Outcome.No, "Invalid outcome");
        
        Resolution storage res = resolutions[_market];
        require(!res.finalized, "Already finalized");
        require(res.votes[msg.sender] == PredictionMarket.Outcome.Unresolved, "Already voted");
        
        res.votes[msg.sender] = _outcome;
        
        if (_outcome == PredictionMarket.Outcome.Yes) {
            res.yesVotes++;
        } else {
            res.noVotes++;
        }
        
        emit OutcomeReported(_market, msg.sender, _outcome);
        
        // Check if we have enough confirmations
        if (res.yesVotes >= requiredConfirmations || res.noVotes >= requiredConfirmations) {
            res.disputeDeadline = block.timestamp + DISPUTE_PERIOD;
        }
    }
    
    /**
     * @notice Finalize the resolution after dispute period
     * @param _market Address of the prediction market
     */
    function finalizeResolution(address payable _market) external {
        Resolution storage res = resolutions[_market];
        require(!res.finalized, "Already finalized");
        require(res.disputeDeadline > 0, "Not enough confirmations");
        require(block.timestamp >= res.disputeDeadline, "Dispute period active");
        
        PredictionMarket.Outcome outcome;
        if (res.yesVotes >= res.noVotes) {
            outcome = PredictionMarket.Outcome.Yes;
        } else {
            outcome = PredictionMarket.Outcome.No;
        }
        
        res.finalized = true;
        
        // Resolve the market
        PredictionMarket(_market).resolve(outcome);
        
        emit MarketFinalized(_market, outcome);
    }
    
    /**
     * @notice Emergency resolution by admin (for hackathon demo)
     */
    function emergencyResolve(
        address payable _market,
        PredictionMarket.Outcome _outcome
    ) external {
        require(msg.sender == admin, "Only admin");
        
        Resolution storage res = resolutions[_market];
        res.finalized = true;
        
        PredictionMarket(_market).resolve(_outcome);
        
        emit MarketFinalized(_market, _outcome);
    }
    
    // ============ View Functions ============
    
    function getResolutionStatus(address payable _market) external view returns (
        uint256 _yesVotes,
        uint256 _noVotes,
        bool _finalized,
        uint256 _disputeDeadline
    ) {
        Resolution storage res = resolutions[_market];
        return (res.yesVotes, res.noVotes, res.finalized, res.disputeDeadline);
    }
}
