pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceContract is Ownable {

  mapping(address => bool) public governanceContracts;

  event GovernanceContractAdded(address addr);
  event GovernanceContractRemoved(address addr);

  modifier onlyGovernanceContracts() {
    require(governanceContracts[msg.sender]);
    _;
  }


  function addAddressToGovernanceContract(address addr) onlyOwner public returns(bool success) {
    if (!governanceContracts[addr]) {
      governanceContracts[addr] = true;
      emit GovernanceContractAdded(addr);
      success = true;
    }
  }


  function removeAddressFromGovernanceContract(address addr) onlyOwner public returns(bool success) {
    if (governanceContracts[addr]) {
      governanceContracts[addr] = false;
      emit GovernanceContractRemoved(addr);
      success = true;
    }
  }
}