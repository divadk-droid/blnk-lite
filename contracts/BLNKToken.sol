// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BLNKToken
 * @dev ERC20 token for BLNK Risk Gate ecosystem
 * @notice Deployed on Base Network (L2)
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BLNKToken is ERC20, ERC20Burnable, Ownable {
    // Total supply: 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // Allocation percentages
    uint256 public constant ISSUER_ALLOCATION = 500_000_000 * 10**18;  // 50%
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18;    // 15%
    uint256 public constant MARKETING_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant COMMUNITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant TREASURY_ALLOCATION = 100_000_000 * 10**18;  // 10%
    
    // Events
    event TokensAllocated(string category, address recipient, uint256 amount);
    
    constructor(
        address _issuer,
        address _team,
        address _marketing,
        address _community,
        address _treasury
    ) ERC20("BLNK Risk Token", "BLNK") {
        require(_issuer != address(0), "Invalid issuer");
        require(_team != address(0), "Invalid team");
        require(_marketing != address(0), "Invalid marketing");
        require(_community != address(0), "Invalid community");
        require(_treasury != address(0), "Invalid treasury");
        
        // Mint allocations
        _mint(_issuer, ISSUER_ALLOCATION);
        _mint(_team, TEAM_ALLOCATION);
        _mint(_marketing, MARKETING_ALLOCATION);
        _mint(_community, COMMUNITY_ALLOCATION);
        _mint(_treasury, TREASURY_ALLOCATION);
        
        emit TokensAllocated("ISSUER", _issuer, ISSUER_ALLOCATION);
        emit TokensAllocated("TEAM", _team, TEAM_ALLOCATION);
        emit TokensAllocated("MARKETING", _marketing, MARKETING_ALLOCATION);
        emit TokensAllocated("COMMUNITY", _community, COMMUNITY_ALLOCATION);
        emit TokensAllocated("TREASURY", _treasury, TREASURY_ALLOCATION);
        
        // Transfer ownership to issuer
        transferOwnership(_issuer);
    }
    
    /**
     * @dev Get allocation details
     */
    function getAllocations() external pure returns (
        uint256 issuer,
        uint256 team,
        uint256 marketing,
        uint256 community,
        uint256 treasury
    ) {
        return (
            ISSUER_ALLOCATION,
            TEAM_ALLOCATION,
            MARKETING_ALLOCATION,
            COMMUNITY_ALLOCATION,
            TREASURY_ALLOCATION
        );
    }
}
