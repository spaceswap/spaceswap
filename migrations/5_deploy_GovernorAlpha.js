const GovernorAlpha = artifacts.require("GovernorAlpha");

const timelock = "0x190f2f3040fa6a1854dcf6a92a45b0aa52a1d47e";
const milk =  "0x81Cfe8eFdb6c7B7218DDd5F6bda3AA4cd1554Fd2";
const guardian = "100000000000000000000";


module.exports = function(deployer) {
  deployer.deploy(Interstellar, baseRatePerYear, multiplierPerYear);
};