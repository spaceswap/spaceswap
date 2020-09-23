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

const MAX_TOTAL_SUPPLY = 10000
const TEST_AMOUNT = 10
const AMOUNT_MINT = 100

const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
const [walletOwner, walletGovernance, wallet1, wallet2] = provider.getWallets();

describe('Blender', () => {  

  let ShakeToken: Contract
  let MilkyWayToken: Contract
  let Blender: Contract
  beforeEach(async () => {

    //deploy MilkyWayToken
    ShakeToken = await deployContract(walletOwner, _ShakeERC20, ['Shake', 'SHK', MAX_TOTAL_SUPPLY])
        
    //deploy MilkyWayToken
    MilkyWayToken = await deployContract(walletOwner, _MilkyWayToken)

    //deploy Blender
    Blender = await deployContract(walletOwner, _Blender, [MilkyWayToken.address, ShakeToken.address, 50, 100])
    
    //owner adds Blender.address to governance of MilkyWayToken
    await MilkyWayToken.connect(walletOwner).addAddressToGovernanceContract(Blender.address)
    await MilkyWayToken.connect(walletOwner).addAddressToGovernanceContract(wallet1.address)

    //owner adds Blender.address to minters of ShakeToken
    await ShakeToken.connect(walletOwner).addMinter(Blender.address)
    
  })

  it('name, symbol, decimals - Shake', async () => {
    const name = await ShakeToken.name()
    expect(name).to.eq('Shake')
    expect(await ShakeToken.symbol()).to.eq('SHK')
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
    expect(await Blender.START_FROM_BLOCK()).to.eq(50)
    expect(await Blender.END_AT_BLOCK()).to.eq(100)
  })

  /*it('block???', async () => {
    let block = await provider.getBlock('latest');
    console.log('block =', block.number)
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }
    let ww55 = await provider.getBlock('latest');
    console.log('block =', ww55.number)
  })*/

  it('getOneShake does not work - start block has not happened yet ', async () => {
    let ww = await provider.getBlock('latest');
    console.log('block =', ww.number)
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice)
    
    let qq = await MilkyWayToken.balanceOf(wallet2.address)
    let ee = await MilkyWayToken.totalSupply()
    let rr = await ShakeToken.totalSupply()
    console.log('balance_Milk=', qq.toString())
    console.log('totalMilk=', ee.toString())
    console.log('totalShake=', rr.toString())
    console.log('currPrice=', currPrice.toString())

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice);

    
    await expect(Blender.connect(wallet2).getOneShake()).to.be.reverted;
    
    let qq1 = await MilkyWayToken.balanceOf(wallet2.address)
    console.log('balance_Milk=', qq1.toString())

    let ww1 = await ShakeToken.balanceOf(wallet2.address)
    let ee1 = await MilkyWayToken.totalSupply()
    let rr1 = await ShakeToken.totalSupply()
    let currPrice1 = await Blender.currShakePrice()
    console.log('balance_Shake=', ww1.toString())
    console.log('totalMilk=', ee1.toString())
    console.log('totalShake=', rr1.toString())
    console.log('currPrice1=', currPrice1.toString())

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice)

    expect(await ShakeToken.totalSupply()).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(currPrice)
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    let ww2 = await provider.getBlock('latest');
    console.log('block =', ww2.number)
  })


  it('getOneShake does not work - milk balance is not enough ', async () => {
    //generate bloks - begin
    let block = await provider.getBlock('latest');
    console.log('block =', block.number)
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }
    let ww55 = await provider.getBlock('latest');
    console.log('block =', ww55.number)
    //generate bloks - end

    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice.sub(1))
    
    let qq = await MilkyWayToken.balanceOf(wallet2.address)
    let ee = await MilkyWayToken.totalSupply()
    let rr = await ShakeToken.totalSupply()
    console.log('balance_Milk=', qq.toString())
    console.log('totalMilk=', ee.toString())
    console.log('totalShake=', rr.toString())
    console.log('currPrice=', currPrice.toString())

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice.sub(1));

    
    await expect(Blender.connect(wallet2).getOneShake()).to.be.reverted
    
    let qq1 = await MilkyWayToken.balanceOf(wallet2.address)
    console.log('balance_Milk=', qq1.toString())

    let ww1 = await ShakeToken.balanceOf(wallet2.address)
    let ee1 = await MilkyWayToken.totalSupply()
    let rr1 = await ShakeToken.totalSupply()
    let currPrice1 = await Blender.currShakePrice()
    console.log('balance_Shake=', ww1.toString())
    console.log('totalMilk=', ee1.toString())
    console.log('totalShake=', rr1.toString())
    console.log('currPrice1=', currPrice1.toString())

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice.sub(1))

    expect(await ShakeToken.totalSupply()).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(currPrice.sub(1))
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    let ww2 = await provider.getBlock('latest');
    console.log('block =', ww2.number)
  })

  it('getOneShake  has worked successfull - all conditions were done', async () => {
    let ww = await provider.getBlock('latest');
    console.log('block =', ww.number)
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice)
    
    let qq = await MilkyWayToken.balanceOf(wallet2.address)
    let ee = await MilkyWayToken.totalSupply()
    let rr = await ShakeToken.totalSupply()
    console.log('balance_Milk=', qq.toString())
    console.log('totalMilk=', ee.toString())
    console.log('totalShake=', rr.toString())
    console.log('currPrice=', currPrice.toString())

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice);

    try {
      await Blender.connect(wallet2).getOneShake();
    } catch (error) {
                               // throw new Error('New owner can not use owner grants');
                                console.log("ERROR! - OK", error.toString());
                    }
    let qq1 = await MilkyWayToken.balanceOf(wallet2.address)
    console.log('balance_Milk=', qq1.toString())


    let ww1 = await ShakeToken.balanceOf(wallet2.address)
    let ee1 = await MilkyWayToken.totalSupply()
    let rr1 = await ShakeToken.totalSupply()
    let currPrice1 = await Blender.currShakePrice()
    console.log('balance_Shake=', ww1.toString())
    console.log('totalMilk=', ee1.toString())
    console.log('totalShake=', rr1.toString())
    console.log('currPrice1=', currPrice1.toString())

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0)

    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.totalSupply()).to.eq(0)
    expect(await Blender.currShakePrice()).to.eq(currPrice.add(await Blender.SHAKE_PRICE_STEP()))
    let ww2 = await provider.getBlock('latest');
    console.log('block =', ww2.number)
  })

  it('getOneShake does not work - the time is finished ', async () => {
    //generate bloks - begin
    let block = await provider.getBlock('latest');
    console.log('block =', block.number)
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }
    let ww55 = await provider.getBlock('latest');
    console.log('block =', ww55.number)
    //generate bloks - end

    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice)
    
    let qq = await MilkyWayToken.balanceOf(wallet2.address)
    let ee = await MilkyWayToken.totalSupply()
    let rr = await ShakeToken.totalSupply()
    console.log('balance_Milk=', qq.toString())
    console.log('totalMilk=', ee.toString())
    console.log('totalShake=', rr.toString())
    console.log('currPrice=', currPrice.toString())

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice);

    
    await expect(Blender.connect(wallet2).getOneShake()).to.be.reverted;
    
    let qq1 = await MilkyWayToken.balanceOf(wallet2.address)
    console.log('balance_Milk=', qq1.toString())

    let ww1 = await ShakeToken.balanceOf(wallet2.address)
    let ee1 = await MilkyWayToken.totalSupply()
    let rr1 = await ShakeToken.totalSupply()
    let currPrice1 = await Blender.currShakePrice()
    console.log('balance_Shake=', ww1.toString())
    console.log('totalMilk=', ee1.toString())
    console.log('totalShake=', rr1.toString())
    console.log('currPrice1=', currPrice1.toString())

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice)

    expect(await ShakeToken.totalSupply()).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(currPrice)
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    let ww2 = await provider.getBlock('latest');
    console.log('block =', ww2.number)
  })

})

