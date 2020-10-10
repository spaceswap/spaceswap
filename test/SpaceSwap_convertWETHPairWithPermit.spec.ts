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
  gasLimit: 9999999999
}


describe('OUR tests_Permit', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let DTT1: Contract
  let DTT2: Contract
  let WETH: Contract
  let router_test: Contract
  let pair1: Contract
  let pair2: Contract
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

  it('convertWETHPairWith Permit: success', async () => {
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

    const nonce = await pair1.nonces(wallet.address)
    const digest = await getApprovalDigest(
          pair1,
          { owner: wallet.address, spender: SpaceSwap.address, value: bigNumberify(200) },
          nonce,
          MaxUint256
        )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    await SpaceSwap.convertWETHPairWithPermit(pair1.address, pair2.address,200, MaxUint256, v,r,s)

    expect(await WETH.balanceOf(pair1.address), 'ddd4').to.not.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address), 'ddd3').to.equal(liquidity1.sub(bigNumberify(200)))
        
    expect(await WETH.balanceOf(pair2.address), 'dd1').to.not.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address), 'ddd').to.not.equal(liquidity2)
    })

it('convertWETHPairWith Permit: wrong signature', async () => {
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

    const nonce = await pair1.nonces(wallet.address)
    const digest = await getApprovalDigest(
          pair1,
          { owner: wallet.address, spender: SpaceSwap.address, value: bigNumberify(200) },
          nonce,
          MaxUint256
        )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    await expect(SpaceSwap.convertWETHPairWithPermit(pair1.address, pair2.address,200, MaxUint256, 1,r,s)).to.be.reverted

    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTTInPair1)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT2.balanceOf(pair2.address)).to.equal(DTTInPair2)
    expect(await WETH.balanceOf(pair2.address)).to.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address)).to.equal(liquidity2)
  })

it('convertWETHPairWith Permit: it is forbidden to use more LP token than permit', async () => {
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

    const nonce = await pair1.nonces(wallet.address)
    const digest = await getApprovalDigest(
          pair1,
          { owner: wallet.address, spender: SpaceSwap.address, value: bigNumberify(200) },
          nonce,
          MaxUint256
        )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    await expect(SpaceSwap.convertWETHPairWithPermit(pair1.address, pair2.address,201, MaxUint256, v,r,s)).to.be.reverted

    expect(await DTT1.balanceOf(pair1.address)).to.equal(DTTInPair1)
    expect(await WETH.balanceOf(pair1.address)).to.equal(WETHInPair1)
    expect(await pair1.balanceOf(wallet.address)).to.equal(liquidity1)
    
    expect(await DTT2.balanceOf(pair2.address)).to.equal(DTTInPair2)
    expect(await WETH.balanceOf(pair2.address)).to.equal(WETHInPair2)
    expect(await pair2.balanceOf(wallet.address)).to.equal(liquidity2)
  })
})

  
