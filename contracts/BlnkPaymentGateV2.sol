// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlnkPaymentGateV2
 * @dev Enhanced version with emergency controls
 * @notice Added: Pausable, ReentrancyGuard upgrade, emergency withdraw
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlnkPaymentGateV2 is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public blnkToken;
    address public treasuryAddress;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Tier thresholds
    uint256 public constant TIER_BASIC = 500 * 10**18;
    uint256 public constant TIER_PRO = 5_000 * 10**18;
    uint256 public constant TIER_ENTERPRISE = 50_000 * 10**18;
    
    // Staking data
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public lastStakeTime;
    mapping(address => uint256) public apiCredits;
    
    // Total stats
    uint256 public totalStaked;
    uint256 public totalBurned;
    uint256 public totalPaidToTreasury;
    
    // Emergency controls
    bool public emergencyMode = false;
    mapping(address => bool) public blacklist;
    
    // Events
    event Staked(address indexed user, uint256 amount, string tier);
    event Unstaked(address indexed user, uint256 amount);
    event ApiPaid(address indexed client, uint256 amount, uint256 burned, uint256 treasuryAmount);
    event CreditsAdded(address indexed client, uint256 credits);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    event Blacklisted(address indexed user, bool status);
    
    constructor(address _blnkToken, address _treasuryAddress) {
        require(_blnkToken != address(0), "Invalid token");
        require(_treasuryAddress != address(0), "Invalid treasury");
        blnkToken = IERC20(_blnkToken);
        treasuryAddress = _treasuryAddress;
    }
    
    modifier notBlacklisted() {
        require(!blacklist[msg.sender], "Address blacklisted");
        _;
    }
    
    /**
     * @dev Stake with pause and blacklist protection
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused notBlacklisted {
        require(amount > 0, "Amount must be > 0");
        require(!emergencyMode, "Emergency mode active");
        
        blnkToken.safeTransferFrom(msg.sender, address(this), amount);
        
        stakedBalances[msg.sender] += amount;
        lastStakeTime[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, getTier(msg.sender));
    }
    
    /**
     * @dev Unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalances[msg.sender] >= amount, "Insufficient balance");
        
        stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;
        
        blnkToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Pay for API with all protections
     */
    function payForApiCall(uint256 amount) external nonReentrant whenNotPaused notBlacklisted {
        require(amount > 0, "Amount must be > 0");
        
        uint256 burnAmount = amount / 2;
        uint256 treasuryAmount = amount - burnAmount;
        
        blnkToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Burn 50%
        blnkToken.safeTransfer(BURN_ADDRESS, burnAmount);
        totalBurned += burnAmount;
        
        // Send to treasury
        blnkToken.safeTransfer(treasuryAddress, treasuryAmount);
        totalPaidToTreasury += treasuryAmount;
        
        // Add credits
        uint256 credits = amount * 100 / 10**18;
        apiCredits[msg.sender] += credits;
        
        emit ApiPaid(msg.sender, amount, burnAmount, treasuryAmount);
        emit CreditsAdded(msg.sender, credits);
    }
    
    /**
     * @dev Get tier
     */
    function getTier(address user) public view returns (string memory) {
        uint256 staked = stakedBalances[user];
        
        if (staked >= TIER_ENTERPRISE) return "ENTERPRISE";
        if (staked >= TIER_PRO) return "PRO";
        if (staked >= TIER_BASIC) return "BASIC";
        return "FREE";
    }
    
    // Admin functions
    
    function setBlacklist(address user, bool status) external onlyOwner {
        blacklist[user] = status;
        emit Blacklisted(user, status);
    }
    
    function toggleEmergencyMode() external onlyOwner {
        emergencyMode = !emergencyMode;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw (only in emergency)
     */
    function emergencyWithdraw(address to) external onlyOwner {
        require(emergencyMode, "Not in emergency mode");
        uint256 balance = blnkToken.balanceOf(address(this));
        blnkToken.safeTransfer(to, balance);
        emit EmergencyWithdraw(to, balance);
    }
}
