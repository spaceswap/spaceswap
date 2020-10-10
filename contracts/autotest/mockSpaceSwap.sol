// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./SpaceSwap.sol";

contract mockSpaceSwap is SpaceSwap {

    constructor (address _router) public {
        router = IUniswapV2Router2(_router);
    }
}