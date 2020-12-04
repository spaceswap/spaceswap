# spaceswap

[Milk2TToken](https://etherscan.io/token/0x80c8c3dcfb854f9542567c8dac3f44d709ebc1de)

[ShakeToken](https://etherscan.io/token/0x6006FC2a849fEdABa8330ce36F5133DE01F96189)

[Interstelar](https://etherscan.io/address/0xb95ebbf2a9fc64e4dc4d6951a60bc4d3c8f55b9d#code)

[Blender](https://etherscan.io/address/0x19b911d1bedcbe6ba3efc372f4ae69710426d85b#code)

[TimeLock](https://etherscan.io/address/0xa17809ce669594dc13b0f218cad87e445bb4d770#code)

[BlackHole](https://etherscan.io/address/0x4c3f2bcbd7b6dad6095ce8f8a3c23aff691a2b23#code)

[Gravity](https://etherscan.io/address/0x159BA6999C7602956d691A54CFaa93563EC8d16B#code)

[BabyMilk2](https://etherscan.io/token/0xe00edf07bbab7f9e7a93ffbffdd4c16c5dbc6b03)

[ShadowStaking](https://etherscan.io/address/0xe3e17fa901591aeecdf0a928489b5362fce3c0ca#code)

[ShadowStakingV2](https://etherscan.io/address/0x5d2af2e012f70b18723e44d0f3158c7939a1827e#code)

[New_Blender](https://etherscan.io/address/0xfe3f277f0b2b4ab4a8e09583484a432af9cfd642#code)

[GravityV2](https://etherscan.io/address/0xe6c87b72269dd9199639a6358a2cefb7caf89a0e#code)

[Galaxy](https://etherscan.io/address/0xb780035440dba56f6cd7d2d522ee9f94f0d9f752#code)

[NFT](https://etherscan.io/address/0x77ec5a5ecf2d3942d45cb059fa1c86a262ec855b#code)

[FArming](https://etherscan.io/address/0xe0057f1c03347e97e416810755376f4be26600b6#code)

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



