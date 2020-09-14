pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract MilkBar is ERC20("MilkBar", "xMILK"){
    using SafeMath for uint256;
    IERC20 public milk;

    constructor(IERC20 _milk) public {
        milk = _milk;
    }

    // Enter the bar. Pay some MILKs. Earn some shares.
    function enter(uint256 _amount) public {
        uint256 totalMilk = milk.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalMilk == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = _amount.mul(totalShares).div(totalMilk);
            _mint(msg.sender, what);
        }
        milk.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your milks.
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = _share.mul(milk.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        milk.transfer(msg.sender, what);
    }
}