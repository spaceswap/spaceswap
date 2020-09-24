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

const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
const [walletOwner, walletGovernance, wallet1, wallet2] = provider.getWallets();

describe('Blender - getMilkForShake', () => {  

  let ShakeToken: Contract
  let MilkyWayToken: Contract
  let Blender: Contract
  beforeEach(async () => {

    //deploy ShakeToken
    ShakeToken = await deployContract(walletOwner, _ShakeERC20, ['Shake', 'SHK', MAX_TOTAL_SUPPLY])
        
    //deploy MilkyWayToken
    MilkyWayToken = await deployContract(walletOwner, _MilkyWayToken)

    //deploy Blender
    Blender = await deployContract(walletOwner, _Blender, [MilkyWayToken.address, ShakeToken.address, 50])
    
    //owner adds Blender.address, wallet1.address to governance of MilkyWayToken
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
    let ww = await ShakeToken.MAX_TOTAL_SUPPLY()
    console.log(ww.toString())
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
  })

  it('getMilkForShake does not work - start block has not happened yet ', async () => {
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice);
    
    await expect(Blender.connect(wallet2).getMilkForShake(1)).to.be.reverted

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice)
    expect(await ShakeToken.totalSupply()).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(currPrice)
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    expect(await ShakeToken.totalMinted()).to.eq(0)
    expect(await ShakeToken.totalBurned()).to.eq(0) 
  })


  it('getMilkForShake does not work - amount of exchange is 0 - nothing has changed ', async () => {
    //generate bloks - begin
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }
    //generate bloks - end
    
    let currPrice = await Blender.currShakePrice()
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0);
    
    await Blender.connect(wallet2).getMilkForShake(0)

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await ShakeToken.totalSupply()).to.eq(0)
    expect(await MilkyWayToken.totalSupply()).to.eq(0)
    expect(await Blender.currShakePrice()).to.eq(currPrice)
    expect(await ShakeToken.totalMinted()).to.eq(0)
    expect(await ShakeToken.totalBurned()).to.eq(0) 
  })


  it('getMilkForShake does not work - shake balance is not enough ', async () => {
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice)

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice);

    await Blender.connect(wallet2).getOneShake()
    
    await expect(Blender.connect(wallet2).getMilkForShake(2)).to.be.reverted
    
    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0)
    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.totalSupply()).to.eq(0)
    expect(await Blender.currShakePrice()).to.eq(currPrice.add(await Blender.SHAKE_PRICE_STEP()))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(1))
    expect(await ShakeToken.totalBurned()).to.eq(0)
  })


  it('getMilkForShake has worked successfull -  all conditions were done', async () => {
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice.mul(3))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice.mul(3));
    //get 2 shake
    await Blender.connect(wallet2).getOneShake()
    await Blender.connect(wallet2).getOneShake()
    //return 1 shake    
    await Blender.connect(wallet2).getMilkForShake(1)

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).
            to.eq((currPrice.mul(3)).sub(currPrice.mul(2)).sub(await Blender.SHAKE_PRICE_STEP())
                    .add((await Blender.currShakePrice()).sub(await Blender.SHAKE_PRICE_STEP())))
    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.totalSupply()).
            to.eq(await MilkyWayToken.balanceOf(wallet2.address))
    expect(await Blender.currShakePrice()).
            to.eq(currPrice.add((await Blender.SHAKE_PRICE_STEP()).mul(2)))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(2))
    expect(await ShakeToken.totalBurned()).to.eq(expandTo18Decimals(1))
  })

  it('getMilkForShake does not work - 3 shake were minted, 2 shake was returned', async () => {
    let currPrice = await Blender.currShakePrice()
    await MilkyWayToken.connect(wallet1).mint(wallet2.address,currPrice.mul(4))

    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(currPrice.mul(4));
    //3 shake has gotten
    await Blender.connect(wallet2).getOneShake()
    await Blender.connect(wallet2).getOneShake()
    await Blender.connect(wallet2).getOneShake()
    

    //!!!! 1 shake has been returned !!!!
    await Blender.connect(wallet2).getMilkForShake(1)

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(2))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).
            to.eq((currPrice.mul(4)).sub(currPrice.mul(3)).sub((await Blender.SHAKE_PRICE_STEP()).mul(3))
                    .add((await Blender.currShakePrice()).sub(await Blender.SHAKE_PRICE_STEP())))

    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(2))
    expect(await MilkyWayToken.totalSupply()).
            to.eq(await MilkyWayToken.balanceOf(wallet2.address))
    expect(await Blender.currShakePrice()).
            to.eq(currPrice.add((await Blender.SHAKE_PRICE_STEP()).mul(3)))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalBurned()).to.eq(expandTo18Decimals(1))

    //generate bloks - begin
    for (let i = 0; i<50; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    }

     //Try return 1 shake yet
    await Blender.connect(wallet2).getMilkForShake(1)

    expect(await ShakeToken.balanceOf(wallet2.address)).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.balanceOf(wallet2.address)).
            to.eq((currPrice.mul(4)).sub(currPrice.mul(3)).sub((await Blender.SHAKE_PRICE_STEP()).mul(3))
                    .add((await Blender.currShakePrice()).sub(await Blender.SHAKE_PRICE_STEP()))
                    .add((await Blender.currShakePrice()).sub(await Blender.SHAKE_PRICE_STEP())))

    expect(await ShakeToken.totalSupply()).to.eq(expandTo18Decimals(1))
    expect(await MilkyWayToken.totalSupply()).
            to.eq(await MilkyWayToken.balanceOf(wallet2.address))
    expect(await ShakeToken.totalMinted()).to.eq(expandTo18Decimals(3))
    expect(await ShakeToken.totalBurned()).to.eq(expandTo18Decimals(2))
  })

})

