import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { BigNumber, bigNumberify } from 'ethers/utils'
import { MaxUint256 } from 'ethers/constants'
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'

import { v2Fixture } from './shared/fixtures'
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from './shared/utilities'

import DeflatingERC20 from '@uniswap/v2-periphery/build/DeflatingERC20.json'
import IUniswapV2ERC20 from '@uniswap/v2-core/build/IUniswapV2ERC20.json'
import { ecsign } from 'ethereumjs-util'

chai.use(solidity)

const overrides = {
  gasLimit: 99999999
}


describe('OUR tests without Permit', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 99999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let DTT1: Contract
  let DTT2: Contract
  let WETH: Contract
  let router_test: Contract
  let pair1: Contract
  let pair2: Contract
  let pairTT: Contract
  let SpaceSwap: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)

    WETH = fixture.WETH
    router_test = fixture.router02
    SpaceSwap = fixture.SpaceSwap_contract

    DTT1 = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)])
    DTT2 = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)])
    
    // make a DTT1<>WETH pair
    await fixture.factoryV2.createPair(DTT1.address, WETH.address)
    const pairAddress1 = await fixture.factoryV2.getPair(DTT1.address, WETH.address)
    pair1 = new Contract(pairAddress1, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

    // make a DTT2<>WETH pair
    await fixture.factoryV2.createPair(DTT2.address, WETH.address)
    const pairAddress2 = await fixture.factoryV2.getPair(DTT2.address, WETH.address)
    pair2 = new Contract(pairAddress2, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

     // make a DTT1<>DTT2 pair
    await fixture.factoryV2.createPair(DTT1.address, DTT2.address)
    const pairAddressTT = await fixture.factoryV2.getPair(DTT1.address, DTT2.address)
    pairTT = new Contract(pairAddressTT, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)
  })

  afterEach(async function() {
    expect(await provider.getBalance(router_test.address)).to.eq(0)
  })

  async function addLiquidity(DTT: Contract, DTTAmount: BigNumber, WETHAmount: BigNumber) {
    await DTT.approve(router_test.address, MaxUint256)
    await router_test.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WETHAmount, wallet.address, MaxUint256, {
      ...overrides,
      value: WETHAmount
    })
  }

  it('convertWETHPair:fail - pairFrom does not have WETH', async () => {
    const DTTAmount1 = expandTo18Decimals(1)
    const DTTAmount2 = expandTo18Decimals(4)
    //recomendation of Uniswap documentation
    await DTT1.approve(router_test.address, MaxUint256)
    await DTT2.approve(router_test.address, MaxUint256)
    await router_test.addLiquidity(DTT1.address, DTT2.address, DTTAmount1, DTTAmount2, 
                                  0, 0, wallet.address, MaxUint256, overrides )
    
    const DTT1InPair = await DTT1.balanceOf(pairTT.address)
    const DTT2InPair = await DTT2.balanceOf(pairTT.address)
    const liquidity1 = await pairTT.balanceOf(wallet.address)

    const ETHAmount1 = expandTo18Decimals(4)
    await addLiquidity(DTT1, DTTAmount1, ETHAmount1)

    const DTWInPair = await DTT1.balanceOf(pair1.address)
    const WETHInPair = await WETH.balanceOf(pair1.address)
    const liquidity2 = await pair1.balanceOf(wallet.address)

    await expect(SpaceSwap.convertWETHPair(pairTT.address, pair1.address,200)).to.be.reverted
    
    expect(await DTT1.balanceOf(pairTT.address)).to.equal(DTT1InPair)
    expect(await DTT2.balanceOf(pairTT.address)).to.equal(DTT2InPair)
    expect(await pairTT.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTWInPair)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity2)


    })

  it('convertWETHPair:fail - pairTo does not have WETH', async () => {
    const DTTAmount1 = expandTo18Decimals(1)
    const DTTAmount2 = expandTo18Decimals(4)
    //recomendation of Uniswap documentation
    await DTT1.approve(router_test.address, MaxUint256)
    await DTT2.approve(router_test.address, MaxUint256)
    await router_test.addLiquidity(DTT1.address, DTT2.address, DTTAmount1, DTTAmount2, 
                                  0, 0, wallet.address, MaxUint256, overrides )
    
    const DTT1InPair = await DTT1.balanceOf(pairTT.address)
    const DTT2InPair = await DTT2.balanceOf(pairTT.address)
    const liquidity1 = await pairTT.balanceOf(wallet.address)

    const ETHAmount1 = expandTo18Decimals(4)
    await addLiquidity(DTT1, DTTAmount1, ETHAmount1)

    const DTWInPair = await DTT1.balanceOf(pair1.address)
    const WETHInPair = await WETH.balanceOf(pair1.address)    
    const liquidity2 = await pair1.balanceOf(wallet.address)

    await expect(SpaceSwap.convertWETHPair(pair1.address, pairTT.address,200)).to.be.reverted
    
    expect(await DTT2.balanceOf(pairTT.address)).to.equal(DTT2InPair)
    expect(await DTT1.balanceOf(pairTT.address)).to.equal(DTT1InPair)
    expect(await pairTT.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTWInPair)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity2)
  })

  it('convertWETHPair - exchange 0 LP', async () => {
    const DTTAmount1 = expandTo18Decimals(1)
    const ETHAmount1 = expandTo18Decimals(4)
    await addLiquidity(DTT1, DTTAmount1, ETHAmount1)

    const DTTAmount2 = expandTo18Decimals(1)
    const ETHAmount2 = expandTo18Decimals(4)
    await addLiquidity(DTT2, DTTAmount2, ETHAmount2)


    const DTTInPair1 = await DTT1.balanceOf(pair1.address)
    const WETHInPair1 = await WETH.balanceOf(pair1.address)
    const liquidity1 = await pair1.balanceOf(wallet.address)

    const DTTInPair2 = await DTT2.balanceOf(pair2.address)
    const WETHInPair2 = await WETH.balanceOf(pair2.address)
    const liquidity2 = await pair2.balanceOf(wallet.address)

    //Attention!! convert will work without allowance 
    await pair1.approve(SpaceSwap.address, MaxUint256)

    await expect(SpaceSwap.convertWETHPair(pair1.address, pair2.address,0)).to.be.reverted

    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTTInPair1)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT2.balanceOf(pair2.address)).to.equal(DTTInPair2)
    expect(await WETH.balanceOf(pair2.address)).to.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address)).to.equal(liquidity2)
    
  })

  it('convertWETHPair - exchange max(LP token)+1', async () => {
    const DTTAmount1 = expandTo18Decimals(1)
    const ETHAmount1 = expandTo18Decimals(4)
    await addLiquidity(DTT1, DTTAmount1, ETHAmount1)
    
    const DTTAmount2 = expandTo18Decimals(1)
    const ETHAmount2 = expandTo18Decimals(4)
    await addLiquidity(DTT2, DTTAmount2, ETHAmount2)
    
    const DTTInPair1 = await DTT1.balanceOf(pair1.address)
    const WETHInPair1 = await WETH.balanceOf(pair1.address)
    const liquidity1 = await pair1.balanceOf(wallet.address)
    
    const DTTInPair2 = await DTT2.balanceOf(pair2.address)
    const WETHInPair2 = await WETH.balanceOf(pair2.address)
    const liquidity2 = await pair2.balanceOf(wallet.address)
    
    //Attention!! convert will work without allowance 
    await pair1.approve(SpaceSwap.address, MaxUint256)

    await expect(SpaceSwap.convertWETHPair(pair1.address, 
                                            pair2.address,liquidity1.add(bigNumberify(1)))).to.be.reverted

    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTTInPair1)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT2.balanceOf(pair2.address)).to.equal(DTTInPair2)
    expect(await WETH.balanceOf(pair2.address)).to.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address)).to.equal(liquidity2)


  })
        
  it('convertWETHPair: success', async () => {
    const DTTAmount1 = expandTo18Decimals(1)
    const ETHAmount1 = expandTo18Decimals(4)
    await addLiquidity(DTT1, DTTAmount1, ETHAmount1)
    
    const DTTAmount2 = expandTo18Decimals(1)
    const ETHAmount2 = expandTo18Decimals(4)
    await addLiquidity(DTT2, DTTAmount2, ETHAmount2)
    
    const DTTInPair1 = await DTT1.balanceOf(pair1.address)
    const WETHInPair1 = await WETH.balanceOf(pair1.address)
    const liquidity1 = await pair1.balanceOf(wallet.address)
    
    const DTTInPair2 = await DTT2.balanceOf(pair2.address)
    const WETHInPair2 = await WETH.balanceOf(pair2.address)
    const liquidity2 = await pair2.balanceOf(wallet.address)

    //Attention!! convert will work without allowance 
    await pair1.approve(SpaceSwap.address, MaxUint256)

    await SpaceSwap.convertWETHPair(pair1.address, pair2.address,200)
    
    expect(await WETH.balanceOf(pair1.address), 'ddd4').to.not.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address), 'ddd3').to.equal(liquidity1.sub(bigNumberify(200)))
        
    expect(await WETH.balanceOf(pair2.address), 'dd1').to.not.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address), 'ddd').to.not.equal(liquidity2)
  })
})

 