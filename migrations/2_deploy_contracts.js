const ConvertLib = artifacts.require("ConvertLib");
const Escrow256 = artifacts.require("Escrow256");
const ERC20 = artifacts.require("ERC20");
const ERC20Detailed = artifacts.require("ERC20");
const IERC20 = artifacts.require("IERC20");
const Ownable = artifacts.require("Ownable");
const SafeMath = artifacts.require("SafeMath");
const SimpleToken = artifacts.require("SimpleToken");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, Escrow256);
  deployer.deploy(Escrow256);
  deployer.deploy(ERC20);
  deployer.link(ERC20, IERC20);
 // deployer.deploy(IERC20);
  deployer.deploy(ERC20Detailed);
  //deployer.deploy(Ownable);
  deployer.deploy(SafeMath);
  deployer.deploy(SimpleToken);
};
