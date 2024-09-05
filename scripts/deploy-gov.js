require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Deploy the implementation contract with proxy
  const Executor = await ethers.getContractFactory("OptimismBridgeExecutor");
  console.log("Deploying...");
  const newImplementation = await Executor.deploy(process.env.L2_MESSENGER, process.env.L1_EXECUTOR, 0, 86400, 0, 1, "0x0000000000000000000000000000000000000000");
  await newImplementation.waitForDeployment();
  console.log(await newImplementation.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
