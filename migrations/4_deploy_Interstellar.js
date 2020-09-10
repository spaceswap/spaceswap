const Interstellar = artifacts.require("Interstellar");

const _milk = "0x190f2f3040fa6a1854dcf6a92a45b0aa52a1d47e";
const _devAddr =  "0x81Cfe8eFdb6c7B7218DDd5F6bda3AA4cd1554Fd2";
const _milkPerBlock = "100000000000000000000";
const _startBlock = "7135000";
const _bonusEndBlock = "7500000";

module.exports = function(deployer) {
  deployer.deploy(Interstellar, baseRatePerYear, multiplierPerYear);
};