// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BLNKLiquidityManager
 * @dev Manages liquidity provision for Uniswap V3
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
}

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    
    function mint(MintParams calldata params) external returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );
    
    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external returns (address pool);
}

contract BLNKLiquidityManager is Ownable {
    using SafeERC20 for IERC20;
    
    // Uniswap V3 contracts on Base
    address public constant UNISWAP_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
    address public constant POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    // BLNK Token
    IERC20 public blnkToken;
    
    // LP position tracking
    uint256 public lpTokenId;
    uint256 public totalLiquidityAdded;
    
    // Events
    event LiquidityAdded(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event LiquidityRemoved(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    
    constructor(address _blnkToken) {
        require(_blnkToken != address(0), "Invalid token");
        blnkToken = IERC20(_blnkToken);
    }
    
    /**
     * @dev Add initial liquidity to Uniswap V3
     * @param blnkAmount Amount of BLNK to add
     * @param ethAmount Amount of ETH to add
     * @param feeTier Fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
     */
    function addInitialLiquidity(
        uint256 blnkAmount,
        uint256 ethAmount,
        uint24 feeTier
    ) external payable onlyOwner returns (uint256 tokenId) {
        require(msg.value == ethAmount, "ETH amount mismatch");
        require(blnkAmount > 0 && ethAmount > 0, "Invalid amounts");
        
        // Sort tokens
        (address token0, address token1) = address(blnkToken) < WETH 
            ? (address(blnkToken), WETH) 
            : (WETH, address(blnkToken));
        
        uint256 amount0 = token0 == address(blnkToken) ? blnkAmount : ethAmount;
        uint256 amount1 = token1 == WETH ? ethAmount : blnkAmount;
        
        // Approve position manager
        IERC20(token0).safeApprove(POSITION_MANAGER, amount0);
        IERC20(token1).safeApprove(POSITION_MANAGER, amount1);
        
        // Calculate price: 1 ETH = 2M BLNK (initial price $0.001 per BLNK)
        uint160 sqrtPriceX96 = uint160(Math.sqrt((2_000_000 * 1e18) / 1e18) * 2**96);
        
        // Create and initialize pool if needed
        INonfungiblePositionManager(POSITION_MANAGER).createAndInitializePoolIfNecessary(
            token0,
            token1,
            feeTier,
            sqrtPriceX96
        );
        
        // Full range liquidity (can be narrowed for concentrated liquidity)
        int24 tickLower = -887220;
        int24 tickUpper = 887220;
        
        // Mint position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: feeTier,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: amount0 * 95 / 100, // 5% slippage
            amount1Min: amount1 * 95 / 100,
            recipient: address(this),
            deadline: block.timestamp + 300
        });
        
        (tokenId, uint128 liquidity, uint256 amount0Used, uint256 amount1Used) = 
            INonfungiblePositionManager(POSITION_MANAGER).mint{value: token1 == WETH ? amount1 : 0}(params);
        
        lpTokenId = tokenId;
        totalLiquidityAdded += liquidity;
        
        emit LiquidityAdded(tokenId, liquidity, amount0Used, amount1Used);
        
        return tokenId;
    }
    
    /**
     * @dev Get pool address
     */
    function getPool(uint24 feeTier) external view returns (address) {
        return IUniswapV3Factory(UNISWAP_FACTORY).getPool(address(blnkToken), WETH, feeTier);
    }
    
    /**
     * @dev Check if pool exists
     */
    function poolExists(uint24 feeTier) external view returns (bool) {
        return this.getPool(feeTier) != address(0);
    }
    
    receive() external payable {}
}

// Math library for sqrt
library Math {
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
