require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function deploy(name, symbol, decimals) {
  // Deploy the implementation contract with proxy
  const Token = await ethers.getContractFactory("L2UpgradeableERC20");
  console.log("Deploying...");
  const token = await upgrades.deployProxy(
    Token,
    [process.env.L2_BRIDGE, process.env.L1_TOKEN, name, symbol, decimals],
    {
      initializer: "initialize",
    }
  );
  await token.waitForDeployment();

  const addressProxy = token.target;
  const addressImpl = await upgrades.erc1967.getImplementationAddress(
    addressProxy
  );
  const addressAdmin = await upgrades.erc1967.getAdminAddress(addressProxy);

  console.log("TransparentUpgradeableProxy:", addressProxy);
  console.log("Implementation:", addressImpl);
  console.log("ProxyAdmin:", addressAdmin);
}

module.exports = { deploy };
