// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BLNK Token
 * @dev ERC20 token with staking, burning, and treasury features
 * @notice Issuer-friendly tokenomics: 50% issuer allocation, 2% initial liquidity
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BLNKToken is ERC20, ERC20Burnable, ReentrancyGuard, Ownable {
    // Tokenomics parameters
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    
    // Allocation (Issuer-friendly)
    uint256 public constant ISSUER_ALLOCATION = 500_000_000 * 10**18;  // 50%
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18;    // 15%
    uint256 public constant MARKETING_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant COMMUNITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant TREASURY_ALLOCATION = 100_000_000 * 10**18;  // 10%
    
    // Staking tiers
    struct StakingTier {
        uint256 minAmount;
        uint256 lockPeriod;
        string name;
    }
    
    mapping(uint256 => StakingTier) public tiers;
    uint256 public tierCount;
    
    // User staking info
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 tierId;
        bool active;
    }
    
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public stakingBalance;
    
    // Treasury
    address public treasury;
    uint256 public totalBurned;
    uint256 public totalStaked;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 tierId);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty);
    event TreasuryFunded(uint256 amount);
    event AutoBurn(uint256 amount);
    
    constructor(
        address _issuer,
        address _team,
        address _marketing,
        address _community,
        address _treasury
    ) ERC20("BLNK Risk Token", "BLNK") {
        require(_issuer != address(0), "Invalid issuer address");
        require(_treasury != address(0), "Invalid treasury address");
        
        // Mint allocations
        _mint(_issuer, ISSUER_ALLOCATION);
        _mint(_team, TEAM_ALLOCATION);
        _mint(_marketing, MARKETING_ALLOCATION);
        _mint(_community, COMMUNITY_ALLOCATION);
        _mint(_treasury, TREASURY_ALLOCATION);
        
        treasury = _treasury;
        
        // Initialize staking tiers
        _addTier(1_000 * 10**18, 30 days, "Bronze");      // 1K BLNK
        _addTier(10_000 * 10**18, 30 days, "Silver");     // 10K BLNK
        _addTier(100_000 * 10**18, 90 days, "Gold");      // 100K BLNK
        _addTier(1_000_000 * 10**18, 180 days, "Platinum"); // 1M BLNK
        
        // Transfer ownership to issuer for management
        transferOwnership(_issuer);
    }
    
    function _addTier(uint256 _minAmount, uint256 _lockPeriod, string memory _name) internal {
        tiers[tierCount] = StakingTier({
            minAmount: _minAmount,
            lockPeriod: _lockPeriod,
            name: _name
        });
        tierCount++;
    }
    
    /**
     * @dev Stake tokens to unlock service tier
     * @param _amount Amount to stake
     * @param _tierId Tier ID (0-3)
     */
    function stake(uint256 _amount, uint256 _tierId) external nonReentrant {
        require(_tierId < tierCount, "Invalid tier");
        require(_amount >= tiers[_tierId].minAmount, "Insufficient amount for tier");
        require(!stakes[msg.sender].active, "Already staking");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), _amount);
        
        stakes[msg.sender] = Stake({
            amount: _amount,
            startTime: block.timestamp,
            tierId: _tierId,
            active: true
        });
        
        stakingBalance[msg.sender] = _amount;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount, _tierId);
    }
    
    /**
     * @dev Unstake tokens with optional penalty for early withdrawal
     */
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        
        uint256 amount = userStake.amount;
        uint256 lockEnd = userStake.startTime + tiers[userStake.tierId].lockPeriod;
        uint256 penalty = 0;
        
        // Early withdrawal penalty (10%)
        if (block.timestamp < lockEnd) {
            penalty = (amount * 10) / 100;
            amount -= penalty;
            
            // Burn penalty
            _burn(address(this), penalty);
            totalBurned += penalty;
            emit AutoBurn(penalty);
        }
        
        // Return remaining tokens
        _transfer(address(this), msg.sender, amount);
        
        totalStaked -= userStake.amount;
        stakingBalance[msg.sender] = 0;
        userStake.active = false;
        
        emit Unstaked(msg.sender, amount, penalty);
    }
    
    /**
     * @dev Check user's staking tier
     */
    function getUserTier(address _user) external view returns (string memory) {
        if (!stakes[_user].active) return "None";
        return tiers[stakes[_user].tierId].name;
    }
    
    /**
     * @dev Check if user has active stake
     */
    function hasActiveStake(address _user) external view returns (bool) {
        return stakes[_user].active;
    }
    
    /**
     * @dev Get staking info
     */
    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockEnd,
        string memory tierName,
        bool active
    ) {
        Stake memory s = stakes[_user];
        uint256 lockEndTime = s.active ? s.startTime + tiers[s.tierId].lockPeriod : 0;
        string memory name = s.active ? tiers[s.tierId].name : "None";
        
        return (s.amount, s.startTime, lockEndTime, name, s.active);
    }
    
    /**
     * @dev Treasury funding (called from service revenue)
     */
    function fundTreasury(uint256 _amount) external {
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        _transfer(msg.sender, treasury, _amount);
        emit TreasuryFunded(_amount);
    }
    
    /**
     * @dev Auto-burn from treasury (called periodically)
     */
    function autoBurn(uint256 _amount) external onlyOwner {
        require(balanceOf(treasury) >= _amount, "Insufficient treasury balance");
        _burn(treasury, _amount);
        totalBurned += _amount;
        emit AutoBurn(_amount);
    }
    
    /**
     * @dev Get burn statistics
     */
    function getBurnStats() external view returns (uint256 total, uint256 percentage) {
        total = totalBurned;
        percentage = (totalBurned * 100) / TOTAL_SUPPLY;
    }
    
    /**
     * @dev Get staking statistics
     */
    function getStakingStats() external view returns (
        uint256 totalStakedAmount,
        uint256 stakedPercentage,
        uint256 activeStakers
    ) {
        totalStakedAmount = totalStaked;
        stakedPercentage = (totalStaked * 100) / TOTAL_SUPPLY;
        // activeStakers would require iteration - simplified for gas
        activeStakers = 0; // Placeholder
    }
}
