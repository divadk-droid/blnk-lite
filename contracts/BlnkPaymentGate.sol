// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlnkPaymentGate
 * @dev A2A Security Agent - On-chain payment and staking gateway for BLNK token
 * @notice 50% of all fees are burned immediately to create deflationary pressure
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlnkPaymentGate is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // BLNK Token contract
    IERC20 public blnkToken;
    
    // Treasury address for non-burned portion
    address public treasuryAddress;
    
    // Burn address (dead address)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Tier thresholds
    uint256 public constant TIER_FREE = 0;
    uint256 public constant TIER_BASIC = 500 * 10**18;      // 500 BLNK
    uint256 public constant TIER_PRO = 5_000 * 10**18;      // 5,000 BLNK
    uint256 public constant TIER_ENTERPRISE = 50_000 * 10**18; // 50,000 BLNK
    
    // Staking data
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public lastStakeTime;
    
    // API credits (1 BLNK = 100 calls)
    mapping(address => uint256) public apiCredits;
    
    // Total stats
    uint256 public totalStaked;
    uint256 public totalBurned;
    uint256 public totalPaidToTreasury;
    
    // Events
    event Staked(address indexed user, uint256 amount, string tier);
    event Unstaked(address indexed user, uint256 amount);
    event ApiPaid(address indexed client, uint256 amount, uint256 burned, uint256 treasuryAmount);
    event CreditsAdded(address indexed client, uint256 credits);
    event CreditsUsed(address indexed client, uint256 used, uint256 remaining);
    
    /**
     * @dev Constructor
     * @param _blnkToken Address of BLNK token contract
     * @param _treasuryAddress Address to receive non-burned fees
     */
    constructor(address _blnkToken, address _treasuryAddress) {
        require(_blnkToken != address(0), "Invalid token address");
        require(_treasuryAddress != address(0), "Invalid treasury address");
        
        blnkToken = IERC20(_blnkToken);
        treasuryAddress = _treasuryAddress;
    }
    
    /**
     * @dev Stake BLNK tokens to unlock tier benefits
     * @param amount Amount of BLNK to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to contract
        blnkToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update staking data
        stakedBalances[msg.sender] += amount;
        lastStakeTime[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        // Determine tier
        string memory tier = getTier(msg.sender);
        
        emit Staked(msg.sender, amount, tier);
    }
    
    /**
     * @dev Unstake BLNK tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalances[msg.sender] >= amount, "Insufficient staked balance");
        
        // Update staking data
        stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        blnkToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Get user's tier based on staked amount
     * @param user Address to check
     * @return tier String representation of tier
     */
    function getTier(address user) public view returns (string memory) {
        uint256 staked = stakedBalances[user];
        
        if (staked >= TIER_ENTERPRISE) {
            return "ENTERPRISE";
        } else if (staked >= TIER_PRO) {
            return "PRO";
        } else if (staked >= TIER_BASIC) {
            return "BASIC";
        } else {
            return "FREE";
        }
    }
    
    /**
     * @dev Get tier details including daily rate limit
     * @param user Address to check
     * @return tierName Tier name
     * @return dailyLimit Daily API call limit
     */
    function getTierDetails(address user) external view returns (string memory tierName, uint256 dailyLimit) {
        tierName = getTier(user);
        
        if (keccak256(bytes(tierName)) == keccak256(bytes("ENTERPRISE"))) {
            dailyLimit = 10000;
        } else if (keccak256(bytes(tierName)) == keccak256(bytes("PRO"))) {
            dailyLimit = 2000;
        } else if (keccak256(bytes(tierName)) == keccak256(bytes("BASIC"))) {
            dailyLimit = 500;
        } else {
            dailyLimit = 5;
        }
    }
    
    /**
     * @dev Pay for API calls - 50% burned, 50% to treasury
     * @param amount Amount of BLNK to pay
     */
    function payForApiCall(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate split: 50% burn, 50% treasury
        uint256 burnAmount = amount / 2;
        uint256 treasuryAmount = amount - burnAmount; // Remainder to handle odd numbers
        
        // Transfer tokens from user
        blnkToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Burn 50%
        blnkToken.safeTransfer(BURN_ADDRESS, burnAmount);
        totalBurned += burnAmount;
        
        // Send 50% to treasury
        blnkToken.safeTransfer(treasuryAddress, treasuryAmount);
        totalPaidToTreasury += treasuryAmount;
        
        // Add API credits (1 BLNK = 100 calls)
        uint256 credits = amount * 100 / 10**18; // Convert to whole tokens then multiply
        apiCredits[msg.sender] += credits;
        
        emit ApiPaid(msg.sender, amount, burnAmount, treasuryAmount);
        emit CreditsAdded(msg.sender, credits);
    }
    
    /**
     * @dev Use API credits (called by backend)
     * @param client Address of client using credits
     * @param calls Number of API calls used
     */
    function useCredits(address client, uint256 calls) external onlyOwner {
        require(apiCredits[client] >= calls, "Insufficient credits");
        
        apiCredits[client] -= calls;
        
        emit CreditsUsed(client, calls, apiCredits[client]);
    }
    
    /**
     * @dev Check if client has sufficient credits
     * @param client Address to check
     * @param required Required credits
     * @return hasCredits True if sufficient
     */
    function hasCredits(address client, uint256 required) external view returns (bool) {
        return apiCredits[client] >= required;
    }
    
    /**
     * @dev Get user's API credits
     * @param user Address to check
     * @return credits Available credits
     */
    function getCredits(address user) external view returns (uint256) {
        return apiCredits[user];
    }
    
    /**
     * @dev Get contract statistics
     * @return totalStakedAmount Total BLNK staked
     * @return totalBurnedAmount Total BLNK burned
     * @return totalTreasuryAmount Total BLNK sent to treasury
     */
    function getStats() external view returns (
        uint256 totalStakedAmount,
        uint256 totalBurnedAmount,
        uint256 totalTreasuryAmount
    ) {
        return (totalStaked, totalBurned, totalPaidToTreasury);
    }
    
    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function setTreasuryAddress(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasuryAddress = newTreasury;
    }
}
