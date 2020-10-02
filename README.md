# spaceswap

Interstellar   https://etherscan.io/address/0xb95ebbf2a9fc64e4dc4d6951a60bc4d3c8f55b9d#code		
MilkyWay Token V2 https://etherscan.io/address/0x80c8c3dcfb854f9542567c8dac3f44d709ebc1de#code		 
TimeLock       https://etherscan.io/address/0xa17809ce669594dc13b0f218cad87e445bb4d770#code		
BlackHole https://etherscan.io/address/0x4c3f2bcbd7b6dad6095ce8f8a3c23aff691a2b23#code
Blender https://etherscan.io/address/0x19b911d1bedcbe6ba3efc372f4ae69710426d85b#code
Shaker https://etherscan.io/address/0x6006FC2a849fEdABa8330ce36F5133DE01F96189#code

##For TimeLock
####SET()
queueTransactions

target:

```0x9e0b8f7520e5edf8ae442254a82a1b41eb759111```

value:
```0```

signature:
```set(uint256,uint256,bool)```

data:
```0x
0000000000000000000000000000000000000000000000000000000000000014
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
```

eta:
```1600268303```


executeTransaction
```
9CEFD353858825C21C41730CD8B78322297A12460B0A007F136CCC5FBA4FDCF0
D2A451FB08C614C73DB446D50BDB38EEDCDAC5FDB9FC9D549AA4D825C99A56A4
8C5E5528D57F0580A9659F8233EB29E165EBCB22427129BFA16CEAD01347A82A
18BAA6DCA6227F0288ABC58B9FD4D77065F9FE6BD040F51815562FDAFD4D94F5
0B1E69CD4502A04800D972259F8A5D06988A430930F2F442D8FBDC4C2959B93D
6857E565047D283E49E87DB7109CAC7FAF88DB8A1C96CA370451B4172A764E74
```
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



