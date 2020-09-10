const TimeLock = artifacts.require("Timelock");

const admin = "0x81cfe8efdb6c7b7218ddd5f6bda3aa4cd1554fd2";
const delay =  1728000;

module.exports = function(deployer) {
  deployer.deploy(TimeLock, admin, delay);
};