// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.12;

interface IMilk2Token {

    function mint(address _to, uint256 _amount) external returns (bool);

    function burn(address _to, uint256 _amount) external returns (bool);

}