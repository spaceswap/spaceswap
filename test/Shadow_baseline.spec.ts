import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { MaxUint256 } from 'ethers/constants'
import { bigNumberify, hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } from 'ethers/utils'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { ecsign, toRpcSig } from 'ethereumjs-util'


import { expandTo18Decimals, mineBlock} from './shared/utilities'

import _MilkyWayToken from '../build/MilkyWayToken.json'
import _ShadowStakingV2 from '../build/ShadowStakingV2.json'


chai.use(solidity)

const MAX_TOTAL_SUPPLY = 10000

const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
const [walletOwner, walletSigner, wallet1, wallet2] = provider.getWallets();

describe('Shadow - simple harvest', () => {  

  let ShadowStakingV2: Contract
  let MilkyWayToken: Contract
  beforeEach(async () => {

    //deploy MilkyWayToken
    MilkyWayToken = await deployContract(walletOwner, _MilkyWayToken)

    //deploy ShadowStakingV2
    ShadowStakingV2 = await deployContract(walletOwner, _ShadowStakingV2, [MilkyWayToken.address, [1,2,3,4,5], [1,2,3,4,5]])
    
    //owner adds ShadowStakingV2.address to governance of MilkyWayToken
    await MilkyWayToken.connect(walletOwner).addAddressToGovernanceContract(ShadowStakingV2.address)

    //owner adds walletSigner to trusted signers ShadowStakingV2
    await ShadowStakingV2.connect(walletOwner).setTrustedSigner(walletSigner.address, true)
    
  })

  it('walletSigner is trusted', async () => {
    const isTrusted = await ShadowStakingV2.trustedSigner(walletSigner.address)
    expect(isTrusted).to.eq(true)
  })

  it('harvest 77777777777777 MILK', async () => {
    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      0,
      1,
      wallet1.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(walletSigner.privateKey.slice(2), 'hex')
    )
    //console.log(signature)
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    
    //console.log(rpcSig)
    await ShadowStakingV2.connect(wallet1).harvest(
      77777777777777, //_amount
      0,
      1,
      ethPrefixedMsg,
      rpcSig
    )
    expect(await MilkyWayToken.balanceOf(wallet1.address)).to.eq(77777777777777);
    //expect(isTrusted).to.eq(true)
  })

  it('harvest  - fail, invalid signer ', async () => {
    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      0,
      1,
      wallet1.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(wallet2.privateKey.slice(2), 'hex')
    )
    //console.log(signature)
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    
    //console.log(rpcSig)
    await expect(ShadowStakingV2.connect(wallet1).harvest(
        77777777777777, //_amount
        0,
        1,
        ethPrefixedMsg,
        rpcSig
      )
    ).to.be.reverted;
    expect(await MilkyWayToken.balanceOf(wallet1.address)).to.eq(0);
    //expect(isTrusted).to.eq(true)
  })


  it('harvest  - fail, message integrety ', async () => {
    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      0,
      1,
      wallet1.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(walletSigner.privateKey.slice(2), 'hex')
    )
    //console.log(signature)
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    
    //console.log(rpcSig)
    await expect(ShadowStakingV2.connect(wallet1).harvest(
        77777777777778, //_amount
        0,
        1,
        ethPrefixedMsg,
        rpcSig
      )
    ).to.be.reverted;
    expect(await MilkyWayToken.balanceOf(wallet1.address)).to.eq(0);
    //expect(isTrusted).to.eq(true)
  })
  

  it('harvest  - fail, when _currentBlockNumber > block.number ', async () => {
    // for (let i = 0; i<5; i++) {
    //   await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
    // }
    const block = await provider.getBlock('latest')
    //console.log(block.number)
    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      0,
      block.number + 100500,
      wallet1.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(walletSigner.privateKey.slice(2), 'hex')
    )
    //console.log(signature)
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    
    //console.log(rpcSig)
    await expect(ShadowStakingV2.connect(wallet1).harvest(
        77777777777777, //_amount
        0,
        block.number + 100500,
        ethPrefixedMsg,
        rpcSig
      )
    ).to.be.revertedWith('currentBlockNumber cannot be larger than the last block');
    expect(await MilkyWayToken.balanceOf(wallet1.address)).to.eq(0);
    //expect(isTrusted).to.eq(true)
  })

  it('harvest (with registration)  - fail , when lastBlockNumber NOT equal to the value in the storage', async () => {
    await ShadowStakingV2.connect(wallet2).registration()
    const lastUserBlock = await ShadowStakingV2.getLastBlock(wallet2.address)
    //console.log('lastUserBlock='+lastUserBlock)
    const block = await provider.getBlock('latest')
    //console.log('Block='+block.number)
    //console.log(block.number)

    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      lastUserBlock+1,
      block.number,
      wallet2.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(walletSigner.privateKey.slice(2), 'hex')
    )
    
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    for (let i = 0; i<3; i++) {
      await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
      console.log('..wait for miners')
    }
    // const block2 = await provider.getBlock('latest')
    // console.log('Block='+block2.number)
    //console.log(rpcSig)
    await expect(ShadowStakingV2.connect(wallet2).harvest(
        77777777777777, //_amount
        lastUserBlock+1,
        block.number,
        ethPrefixedMsg,
        rpcSig
      )
    ).to.be.revertedWith('lastBlockNumber must be equal to the value in the storage');
    expect(await MilkyWayToken.balanceOf(wallet2.address)).to.eq(0);
    //expect(isTrusted).to.eq(true)
  })

  it('harvest  - Double spent check', async () => {
    const abiencodedMsg = await ShadowStakingV2.getMsgForSign(
      77777777777777, //_amount
      0,
      1,
      wallet1.address
    )
    //console.log(abiencodedMsg)
    const ethPrefixedMsg = await ShadowStakingV2.preSignMsg(abiencodedMsg)
    //console.log(ethPrefixedMsg)
    //console.log('privateKey='+ walletSigner.privateKey)
    const signature = ecsign(
      Buffer.from(ethPrefixedMsg.slice(2), 'hex'), 
      Buffer.from(walletSigner.privateKey.slice(2), 'hex')
    )
    //console.log(signature)
    const rpcSig = toRpcSig(signature.v, signature.r, signature.s)
    
    //console.log(rpcSig)
    await ShadowStakingV2.connect(wallet1).harvest(
      77777777777777, //_amount
      0,
      1,
      ethPrefixedMsg,
      rpcSig
    )
    expect(await MilkyWayToken.balanceOf(wallet1.address)).to.eq(77777777777777);
    //Double spent
    await expect( ShadowStakingV2.connect(wallet1).harvest(
      77777777777777, //_amount
      0,
      1,
      ethPrefixedMsg,
      rpcSig
    )).to.be.revertedWith('lastBlockNumber must be equal to the value in the storage')
    //expect(isTrusted).to.eq(true)
  })  

})

