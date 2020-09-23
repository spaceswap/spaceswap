import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { MaxUint256 } from 'ethers/constants'
import { bigNumberify, hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } from 'ethers/utils'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { ecsign } from 'ethereumjs-util'

import { expandTo18Decimals } from './shared/utilities'

import ShakeERC20 from '../build/ShakeERC20.json'

chai.use(solidity)

const MAX_TOTAL_SUPPLY = 10000
const TEST_AMOUNT = 10
const AMOUNT_MINT = 100

const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
const [walletMinter, walletShake, wallet1, wallet2] = provider.getWallets();

describe('ShakeERC20', () => {  

  let token: Contract
  beforeEach(async () => {
    token = await deployContract(walletMinter, ShakeERC20, ['Shake', 'SHK', MAX_TOTAL_SUPPLY])
    await token.connect(walletMinter).mint(walletShake.address, AMOUNT_MINT)
  })

  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    const name = await token.name()
    expect(name).to.eq('Shake')
    expect(await token.symbol()).to.eq('SHK')
    expect(await token.decimals()).to.eq(18)
    expect(await token.MAX_TOTAL_SUPPLY()).to.eq(expandTo18Decimals(MAX_TOTAL_SUPPLY))
    expect(await token.totalSupply()).to.eq(AMOUNT_MINT)
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT)
  })

  it('approve', async () => {
    await expect(token.connect(walletShake).approve(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(walletShake.address, wallet1.address, TEST_AMOUNT)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer', async () => {
    await expect(token.connect(walletShake).transfer(wallet2.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(walletShake.address, wallet2.address, TEST_AMOUNT);
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT-TEST_AMOUNT)
    expect(await token.balanceOf(wallet2.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer:fail', async () => {
    await expect(token.connect(walletShake).transfer(wallet2.address, AMOUNT_MINT+1)).to.be.reverted; 
    await expect(token.connect(wallet2).transfer(walletShake.address, 1)).to.be.reverted; 
  })

  it('transferFrom', async () => {
    await token.connect(walletShake).approve(wallet1.address, TEST_AMOUNT)
    await expect(token.connect(wallet1).transferFrom(walletShake.address, wallet2.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(walletShake.address, wallet2.address, TEST_AMOUNT)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(0)
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT-TEST_AMOUNT)
    expect(await token.balanceOf(wallet2.address)).to.eq(TEST_AMOUNT)
  })

  it('transferFrom: allowance is more than balance', async () => {
    await token.connect(walletShake).approve(wallet1.address, MaxUint256)
    await expect(token.connect(wallet1).transferFrom(walletShake.address, wallet2.address, MaxUint256)).to.be.reverted;
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(MaxUint256);
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT);
    expect(await token.balanceOf(wallet2.address)).to.eq(0);

    await token.connect(walletShake).approve(wallet1.address, MaxUint256)
    await expect(token.connect(wallet1).transferFrom(walletShake.address, wallet2.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(walletShake.address, wallet2.address, TEST_AMOUNT)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(MaxUint256.sub(TEST_AMOUNT));
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT - TEST_AMOUNT);
    expect(await token.balanceOf(wallet2.address)).to.eq(TEST_AMOUNT);
  })

  it('increaseAllowance', async () => {
    await expect(token.connect(walletShake).increaseAllowance(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(walletShake.address, wallet1.address, TEST_AMOUNT)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(TEST_AMOUNT)
   await token.connect(wallet1).transferFrom(walletShake.address, wallet2.address, TEST_AMOUNT);
   expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(0)
   expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT-10)
   expect(await token.balanceOf(wallet2.address)).to.eq(10)
  })

  it('decreaseAllowance', async () => {
    await expect(token.connect(walletShake).increaseAllowance(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(walletShake.address, wallet1.address, TEST_AMOUNT)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(TEST_AMOUNT)
    await expect(token.connect(walletShake).decreaseAllowance(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(walletShake.address, wallet1.address, 0)
    expect(await token.allowance(walletShake.address, wallet1.address)).to.eq(0)
    await expect(token.connect(wallet1).transferFrom(walletShake.address, wallet2.address, TEST_AMOUNT)).to.be.reverted
  })

  it('only minter can call method "mint"', async () => {
    await expect(token.connect(walletShake).mint(wallet1.address, TEST_AMOUNT)).to.be.reverted;
    await expect(token.connect(walletMinter).mint(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs('0x0000000000000000000000000000000000000000', wallet1.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet1.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(AMOUNT_MINT+TEST_AMOUNT)
  })


  it('minter can not mint more than MAX_TOTAL_SUPPLY', async () => {
    //before "it" tokens has already been minted in the amount AMOUNT_MINT
    await expect(token.connect(walletMinter).mint(wallet1.address, expandTo18Decimals(MAX_TOTAL_SUPPLY))).to.be.reverted
  })

  it('minter can not mint to address(0)', async () => {
    await expect(token.connect(walletMinter).mint('0x0000000000000000000000000000000000000000', expandTo18Decimals(TEST_AMOUNT))).to.be.reverted
  })
  

  it('minter can add other minter to contract (wallet2)', async () => {
    await token.connect(walletMinter).addMinter(wallet2.address);
    await expect(token.connect(wallet2).mint(wallet1.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs('0x0000000000000000000000000000000000000000', wallet1.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet1.address)).to.eq(TEST_AMOUNT)
    expect(await token.totalSupply()).to.eq(AMOUNT_MINT+TEST_AMOUNT)
    
    await token.connect(wallet2).renounceMinter();
    await expect(token.connect(wallet2).mint(wallet1.address, TEST_AMOUNT)).to.be.reverted
  })

  it('minter can burn tokens', async () => {
    await expect(token.connect(wallet1).burn(walletShake.address, AMOUNT_MINT)).to.be.reverted
    await expect(token.connect(walletMinter).burn(walletShake.address, AMOUNT_MINT))
      .to.emit(token, 'Transfer')
      .withArgs(walletShake.address, '0x0000000000000000000000000000000000000000', AMOUNT_MINT)
    expect(await token.balanceOf(walletShake.address)).to.eq(0)
    expect(await token.totalSupply()).to.eq(0)
    await expect(token.connect(walletMinter).burn(walletShake.address, 1)).to.be.reverted
    
  })

  it('minter burns 0 tokens', async () => {
    await token.connect(walletMinter).burn(walletShake.address, 0)
    expect(await token.balanceOf(walletShake.address)).to.eq(AMOUNT_MINT)
    expect(await token.totalSupply()).to.eq(AMOUNT_MINT)
    
  })

})