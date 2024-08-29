# L2UpgradeableERC20

Generic Upgradeable ERC20 that can be minted/burned on Zircuit L2.
Requirements for the token come for [wstETH bridging guide](https://docs.lido.fi/token-guides/wsteth-bridging-guide).
The design and implementation are inspired by `OptimismMintableERC20` from Optimism and `BridgedToken` from Linea.

## Instructions

```
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

```
// deploy any token (must pass arguments to deploy.js)
npx hardhat run scripts/deploy.js --network zircuit

// deploy wstETH
npx hardhat run scripts/deploy-wstETH.js --network zircuit
```

## Verification

The implementation contract can be verified on Zircuit Explorer using:

```
npx hardhat verify --network zircuit IMPL_CONTRACT
```

where `IMPL_CONTRACT` is the address of the contract that implements the token.

Verification of proxy contracts is a bit [more complex](https://forum.openzeppelin.com/t/how-to-verify-a-contract-on-etherscan-bscscan-polygonscan/14225).

1. Download the file [solc-input.json](https://forum.openzeppelin.com/uploads/short-url/yuhWpGxcU7vD7Hj5PfovuTKaK2s.json).
1. Verify `ProxyAdmin`.
   1. Find the contract on Zircuit Explorer.
   1. Verify the contract by choosing solc 0.8.20 and submit the downloaded file.
1. Verify `TransparentUpgradeableProxy`.
   1. Find the contract on Zircuit Explorer.
   1. [Extract constructor arguments](https://info.etherscan.com/contract-verification-constructor-arguments/) from the contract deployment transaction.
   1. Verify the contract by choosing solc 0.8.20 and submit the downloaded file together with constructor arguments.
