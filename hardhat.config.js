require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    zircuit: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  optimizer: {
    enabled: true,
    runs: 200,
  },
  etherscan: {
    apiKey: {
      zircuit: process.env.API_KEY || "",
    },
    customChains: [
      {
        network: "zircuit",
        chainId: process.env.CHAIN_ID || 0,
        urls: {
          apiURL: process.env.API_URL || "",
          browserURL: process.env.BROWSER_URL || "",
        },
      },
    ],
  },
};
