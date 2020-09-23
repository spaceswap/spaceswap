// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.12;

import "./MilkyWayToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//
//
//
//
contract BlackHole is Ownable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    MilkyWayToken public milk;

    constructor(MilkyWayToken _milk) {
        milk = _milk;
    }

    /**
    * @dev
    */
    function checkGovernance() public returns true{
        require(milk.isGovernanceContract == true);
        return true;
    }

    /**
    * @dev
    */
    function giveOblivion(uint256 _amount) public external returns(bools) {
        milk.burn(_amount, msg.sender);
        return true;
    }
}