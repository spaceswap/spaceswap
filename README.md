# spaceswap

[Milk2TToken](https://etherscan.io/address/0x80c8c3dcfb854f9542567c8dac3f44d709ebc1de#code)

[BabyMilk2](https://etherscan.io/address/0xe00edf07bbab7f9e7a93ffbffdd4c16c5dbc6b03#code)

[ShakeToken](https://etherscan.io/address/0x6006FC2a849fEdABa8330ce36F5133DE01F96189#code)

[Interstelar](https://etherscan.io/address/0xb95ebbf2a9fc64e4dc4d6951a60bc4d3c8f55b9d#code)

[BlenderV2](https://etherscan.io/address/0xfe3f277f0b2b4ab4a8e09583484a432af9cfd642#code)

[TimeLock](https://etherscan.io/address/0xa17809ce669594dc13b0f218cad87e445bb4d770#code)

[BlackHole](https://etherscan.io/address/0x4c3f2bcbd7b6dad6095ce8f8a3c23aff691a2b23#code)

[ShadowStakingV2](https://etherscan.io/address/0x7f364003609004e83e96412a9d6f9794a91a5377#code)

[GravityV2](https://etherscan.io/address/0xe6c87b72269dd9199639a6358a2cefb7caf89a0e#code)

[NFT](https://etherscan.io/address/0x77ec5a5ecf2d3942d45cb059fa1c86a262ec855b#code)

[FArmingV2](https://etherscan.io/address/0xc0a70f78e6585677ef6bbd0c9fcfa9a85f4ae81b#code)


####ADD()

## Shake & Blender
### Testing
Tests for `Shake & Blender`  implemented with [waffle](https://ethereum-waffle.readthedocs.io/) 
and `yarn`. For run test's without installing yarn you can use `docker` as followed

#### Prepare docker environment
```bash
#clone git repo
git clone git@github.com:spaceswap/spaceswap.git

#change folder
cd <project_folder>

#Copy MILK2 and dependecies on ./contracts/autotest folder
cp ./contracts/MilkyWayToken.sol  ./contracts/autotest/MilkyWayToken.sol 
cp ./contracts/GovernanceContract.sol  ./contracts/autotest/GovernanceContract.sol

#run docker container with node and mapped sources
docker run -it -v $(pwd):/app node:12 bash
cd /app
```

#### Inside docker container (or local if you have node and yarn installed)
```bash 
#Install dependecies
yarn

#Add external dependency
yarn add @openzeppelin/contracts -D

yarn compile

yarn test
```

### Deploy
#### Shake 
No constructor params any more  

#### Blender  
Please specify the following parametrs when deploying:  
`_milkAddress` -  MILK2 contract address
`_shakeAddress` - SHAKE contract address 
`_startFromBlock` - from this block Blender will start

### Frontend metrics
Max Supply  - `ShakeToken.MAX_TOTAL_SUPPLY()`  
Current Supply - `ShakeToken.totalSupply()`  
Available to mint  - `ShakeToken.MAX_TOTAL_SUPPLY()` - `ShakeToken.totalSupply()`  
Total burned - `ShakeToken.totalBurned()`  
Total minted - `ShakeToken.totalMinted()`  
Current price - `Blender.currShakePrice()`  
Price increment - `Blender.SHAKE_PRICE_STEP()`  



