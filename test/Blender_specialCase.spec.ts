import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { MaxUint256 } from 'ethers/constants'
import { bigNumberify, hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } from 'ethers/utils'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { ecsign } from 'ethereumjs-util'

import { expandTo18Decimals, mineBlock} from './shared/utilities'

import _ShakeERC20 from '../build/ShakeERC20.json'
import _MilkyWayToken from '../build/MilkyWayToken.json'
import _Blender from '../build/Blender.json'


chai.use(solidity)

const MAX_TOTAL_SUPPLY = 10000  //only 3 shake are able to be minted

const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
const [walletOwner, walletGovernance, wallet1, wallet2] = provider.getWallets();

describe('Blender - special cases', () => {  

  let ShakeToken: Contract
  let MilkyWayToken: Contract
  let Blender: Contract
  beforeEach(async () => {

    //deploy MilkyWayToken
    ShakeToken = await deployContract(walletOwner, _ShakeERC20)
        
    //deploy MilkyWayToken
    MilkyWayToken = await deployContract(walletOwner, _MilkyWayToken)

    //deploy Blender
    Blender = await deployContract(walletOwner, _Blender, [MilkyWayToken.address, ShakeToken.address, 40])
    
    //owner adds Blender.address to governance of MilkyWayToken
    await MilkyWayToken.connect(walletOwner).addAddressToGovernanceContract(Blender.address)
    await MilkyWayToken.connect(walletOwner).addAddressToGovernanceContract(wallet1.address)

    //owner adds Blender.address and wallet1.address to minters of ShakeToken
    await ShakeToken.connect(walletOwner).addMinter(Blender.address)
    await ShakeToken.connect(walletOwner).addMinter(wallet1.address)
    
  })

  it('name, symbol, decimals - Shake', async () => {
    const name = await ShakeToken.name()
    expect(name).to.eq('SHAKE token by SpaceSwap v2')
    expect(await ShakeToken.symbol()).to.eq('SHAKE')
    expect(await ShakeToken.decimals()).to.eq(18)
    expect(await ShakeToken.MAX_TOTAL_SUPPLY()).to.eq(expandTo18Decimals(MAX_TOTAL_SUPPLY))
  })
  
  it('name, symbol, decimals - MilkyWayToken', async () => {
    const name = await MilkyWayToken.name()
    expect(name).to.eq('MilkyWayToken')
    expect(await MilkyWayToken.symbol()).to.eq('MILK2')
    expect(await MilkyWayToken.decimals()).to.eq(18)
  })

  it('MILK_ADDRESS, SHAKE_ADDRESS, START_FROM_BLOCK, END_AT_BLOCK  - Blender', async () => {
    expect(await Blender.MILK_ADDRESS()).to.eq(MilkyWayToken.address)
    expect(await Blender.SHAKE_ADDRESS()).to.eq(ShakeToken.address)
    expect(await Blender.START_FROM_BLOCK()).to.eq(40)
  })

  it('getMilkForShake works only after START_FROM_BLOCK', async () => {
    await ShakeToken.connect(wallet1).mint(wallet2.address, expandTo18Decimals(3))
    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(3))

    await expect(Blender.connect(wallet2).getMilkForShake(1)).to.be.reverted

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalBurned()).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(0)
  })

 it('getOneShake does not work - Minting has reached MAX_TOTAL_SUPPLY ', async () => {
    //generate bloks - begin
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }
    //generate bloks - end 

    //mint  MAX_TOTAL_SUPPLY shakes
    await ShakeToken.connect(wallet1).mint(wallet2.address, await ShakeToken.MAX_TOTAL_SUPPLY())

    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice.mul(2))

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice.mul(2));
    //try to mint shake more than MAX_TOTAL_SUPPLY
    await expect(Blender.connect(wallet2).getOneShake()).to.be.reverted
    //burn 1 shake through exchanging milk - call getMilkForShake 
    await Blender.connect(wallet2).getMilkForShake(1)
 
    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq((await ShakeToken.MAX_TOTAL_SUPPLY()).sub(expandTo18Decimals(1)))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).
            to.eq(currPrice.mul(2).add(currPrice).sub(await Blender.SHAKE_PRICE_STEP()))
    expect(await ShakeToken.totalSupply()).to.eq((await ShakeToken.MAX_TOTAL_SUPPLY()).sub(expandTo18Decimals(1)))
    expect(await MilkyWayToken.totalSupply()).
            to.eq(currPrice.mul(2).add(currPrice).sub(await Blender.SHAKE_PRICE_STEP()))
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    expect(await ShakeToken.totalMinted()).to.eq(await ShakeToken.MAX_TOTAL_SUPPLY())
    expect(await ShakeToken.totalBurned()).to.eq(expandTo18Decimals(1))

    // mint new shake - call getOneShake(1) - success
    await Blender.connect(wallet2).getOneShake()
    // mint new shake - call getOneShake() - fail - more than Max_Total_Supply
    await expect(Blender.connect(wallet2).getOneShake()).to.be.reverted
    // mint new shake - call getOneShake(1) - success

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(await ShakeToken.MAX_TOTAL_SUPPLY())
    expect(await MilkyWayToken.balanceOf(wallet2.address)).
             to.eq(currPrice.mul(2).add(currPrice).sub(await Blender.SHAKE_PRICE_STEP())
                    .sub(currPrice))
    expect(await ShakeToken.totalSupply()).to.eq(await ShakeToken.MAX_TOTAL_SUPPLY())
    expect(await MilkyWayToken.totalSupply()).
               to.eq(currPrice.mul(2).add(currPrice).sub(await Blender.SHAKE_PRICE_STEP())
                    .sub(currPrice))
    expect(await ShakeToken.totalMinted()).to.eq((await ShakeToken.MAX_TOTAL_SUPPLY()).add(expandTo18Decimals(1)))
    expect(await ShakeToken.totalBurned()).to.eq(expandTo18Decimals(1))
  })
})


