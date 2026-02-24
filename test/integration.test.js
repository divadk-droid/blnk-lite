/**
 * BLNK Integration Tests
 * Tests the complete A2A Security Agent flow
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('BLNK A2A Security Agent Integration', function () {
  // Contracts
  let blnkToken;
  let paymentGate;
  
  // Accounts
  let owner;
  let issuer;
  let team;
  let marketing;
  let community;
  let treasury;
  let user1;
  let user2;
  
  // Constants
  const TOTAL_SUPPLY = ethers.parseEther('1000000000'); // 1B tokens
  const ISSUER_ALLOCATION = ethers.parseEther('500000000'); // 500M
  const TEAM_ALLOCATION = ethers.parseEther('150000000'); // 150M
  
  beforeEach(async function () {
    // Get signers
    [owner, issuer, team, marketing, community, treasury, user1, user2] = await ethers.getSigners();
    
    // Deploy BLNK Token
    const BLNKToken = await ethers.getContractFactory('BLNKToken');
    blnkToken = await BLNKToken.deploy(
      issuer.address,
      team.address,
      marketing.address,
      community.address,
      treasury.address
    );
    
    // Deploy Payment Gate
    const BlnkPaymentGate = await ethers.getContractFactory('BlnkPaymentGate');
    paymentGate = await BlnkPaymentGate.deploy(
      await blnkToken.getAddress(),
      treasury.address
    );
    
    // Transfer some tokens to users for testing
    await blnkToken.connect(issuer).transfer(user1.address, ethers.parseEther('10000'));
    await blnkToken.connect(issuer).transfer(user2.address, ethers.parseEther('100000'));
  });
  
  describe('Token Deployment', function () {
    it('Should deploy with correct total supply', async function () {
      expect(await blnkToken.totalSupply()).to.equal(TOTAL_SUPPLY);
    });
    
    it('Should allocate 50% to issuer', async function () {
      expect(await blnkToken.balanceOf(issuer.address)).to.equal(ISSUER_ALLOCATION);
    });
    
    it('Should allocate 15% to team', async function () {
      expect(await blnkToken.balanceOf(team.address)).to.equal(TEAM_ALLOCATION);
    });
  });
  
  describe('Staking System', function () {
    it('Should allow users to stake tokens', async function () {
      const stakeAmount = ethers.parseEther('1000');
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), stakeAmount);
      await paymentGate.connect(user1).stake(stakeAmount);
      
      expect(await paymentGate.stakedBalances(user1.address)).to.equal(stakeAmount);
    });
    
    it('Should return correct tier based on stake', async function () {
      // Stake 1,000 BLNK (BASIC tier)
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), ethers.parseEther('1000'));
      await paymentGate.connect(user1).stake(ethers.parseEther('1000'));
      
      expect(await paymentGate.getTier(user1.address)).to.equal('BASIC');
      
      // Stake more to reach PRO tier
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), ethers.parseEther('5000'));
      await paymentGate.connect(user1).stake(ethers.parseEther('5000'));
      
      expect(await paymentGate.getTier(user1.address)).to.equal('PRO');
    });
    
    it('Should allow unstaking', async function () {
      const stakeAmount = ethers.parseEther('1000');
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), stakeAmount);
      await paymentGate.connect(user1).stake(stakeAmount);
      
      await paymentGate.connect(user1).unstake(stakeAmount);
      
      expect(await paymentGate.stakedBalances(user1.address)).to.equal(0);
    });
  });
  
  describe('Payment System', function () {
    it('Should burn 50% of payment', async function () {
      const paymentAmount = ethers.parseEther('100');
      const burnAmount = paymentAmount / 2n;
      
      const initialBurned = await paymentGate.totalBurned();
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), paymentAmount);
      await paymentGate.connect(user1).payForApiCall(paymentAmount);
      
      const finalBurned = await paymentGate.totalBurned();
      expect(finalBurned - initialBurned).to.equal(burnAmount);
    });
    
    it('Should send 50% to treasury', async function () {
      const paymentAmount = ethers.parseEther('100');
      const treasuryAmount = paymentAmount / 2n;
      
      const initialTreasury = await paymentGate.totalPaidToTreasury();
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), paymentAmount);
      await paymentGate.connect(user1).payForApiCall(paymentAmount);
      
      const finalTreasury = await paymentGate.totalPaidToTreasury();
      expect(finalTreasury - initialTreasury).to.equal(treasuryAmount);
    });
    
    it('Should add API credits (1 BLNK = 100 calls)', async function () {
      const paymentAmount = ethers.parseEther('10'); // 10 BLNK
      const expectedCredits = 1000n; // 10 * 100
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), paymentAmount);
      await paymentGate.connect(user1).payForApiCall(paymentAmount);
      
      expect(await paymentGate.getCredits(user1.address)).to.equal(expectedCredits);
    });
  });
  
  describe('Tier Benefits', function () {
    it('Should give correct daily limits', async function () {
      // FREE tier
      let tierDetails = await paymentGate.getTierDetails(user1.address);
      expect(tierDetails.dailyLimit).to.equal(5);
      
      // Stake for BASIC tier
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), ethers.parseEther('500'));
      await paymentGate.connect(user1).stake(ethers.parseEther('500'));
      
      tierDetails = await paymentGate.getTierDetails(user1.address);
      expect(tierDetails.dailyLimit).to.equal(500);
      
      // Stake for PRO tier
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), ethers.parseEther('5000'));
      await paymentGate.connect(user1).stake(ethers.parseEther('5000'));
      
      tierDetails = await paymentGate.getTierDetails(user1.address);
      expect(tierDetails.dailyLimit).to.equal(2000);
    });
  });
  
  describe('Events', function () {
    it('Should emit Staked event', async function () {
      const stakeAmount = ethers.parseEther('1000');
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), stakeAmount);
      
      await expect(paymentGate.connect(user1).stake(stakeAmount))
        .to.emit(paymentGate, 'Staked')
        .withArgs(user1.address, stakeAmount, 'BASIC');
    });
    
    it('Should emit ApiPaid event', async function () {
      const paymentAmount = ethers.parseEther('100');
      const burnAmount = paymentAmount / 2n;
      const treasuryAmount = paymentAmount / 2n;
      
      await blnkToken.connect(user1).approve(await paymentGate.getAddress(), paymentAmount);
      
      await expect(paymentGate.connect(user1).payForApiCall(paymentAmount))
        .to.emit(paymentGate, 'ApiPaid')
        .withArgs(user1.address, paymentAmount, burnAmount, treasuryAmount);
    });
  });
});
