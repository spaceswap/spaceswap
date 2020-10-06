## SpaceSwap

### Mainnet
`SpaseSwap.sol` ready for deployment in Ethereum mainnet


### Rinkeby Testnet
Contract deployed at Rinkeby testnet
[0x58a9ceffe63c5ce63b2cf3af2c11c07037cf8c96](https://rinkeby.etherscan.io/address/0x58a9ceffe63c5ce63b2cf3af2c11c07037cf8c96#code)  

#### Usefull links for testing
[UNiswap Router02 Link to Rinkeby Etherscan](https://rinkeby.etherscan.io/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)  
[Rinkeby WETH Contract](https://rinkeby.etherscan.io/address/0xc778417e063141139fce010982780140aa0cd5ab#readContract)  
[Rinkeby Dai Contract](https://rinkeby.etherscan.io/address/0xc7ad46e0b8a400bb3c915120d284aafba8fc4735#code)  
[Rinkeby MKR contract](https://rinkeby.etherscan.io/address/0xf9ba5210f91d0474bd1e1dcdaec4c58e359aad85#code)  
[DAI/WETH Pair at Rinkeby](https://rinkeby.etherscan.io/address/0x8B22F85d0c844Cf793690F6D9DFE9F11Ddb35449#readContract)  
[WETH/MKR Pair  at Rinkeby](https://rinkeby.etherscan.io/address/0x80f07c368BCC7F8CbAC37E79Ec332c1D84e9335D#readContract)  

###Usage Note
1. Note that `from` and `to` pairs must include WETH
2. If use direct `convertWETHPair` don't forget give `approve` to this
 contract in `fromLP` pair contract