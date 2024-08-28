# L2UpgradeableERC20

Generic Upgradeable ERC20 that can be minted/burned on Zircuit L2

## Instructions

```
npm install
npx hardhat compile

// deploy wstETH
npx hardhat run scripts/deploy-wstETH.js --network zircuit
```

## Verification

The implementation contract can be verified on Zircuit Explorer using:

```
npx hardhat verify --network zircuit IMPL_CONTRACT
```

where `IMPL_CONTRACT` is the address of the contract that implement the token.

Verification of proxy contracts is a bit [more complex](https://forum.openzeppelin.com/t/how-to-verify-a-contract-on-etherscan-bscscan-polygonscan/14225).

1. Download the file [solc-input.json](https://forum.openzeppelin.com/uploads/short-url/yuhWpGxcU7vD7Hj5PfovuTKaK2s.json).
1. Verify `ProxyAdmin`.
   1. Find the contract on Zircuit Explorer.
   1. Verify the contract by choosing solc 0.8.20 and submit the downloaded file.
1. Verify `TransparentUpgradeableProxy`.
   1. Find the contract on Zircuit Explorer.
   1. [Extract constructor arguments](https://info.etherscan.com/contract-verification-constructor-arguments/) from the contract deployment transaction.
   1. Verify the contract by choosing solc 0.8.20 and submit the downloaded file together with constructor arguments.
