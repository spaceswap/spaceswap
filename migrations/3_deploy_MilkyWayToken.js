const MilkyWayToken = artifacts.require("MilkyWayToken");

module.exports = function(deployer) {
  deployer.deploy(MilkyWayToken);
};