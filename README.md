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
npx hardhat verify --network zircuit PROXY_CONTRACT
```

where `PROXY_CONTRACT` is the address of the Proxy contract that points to the token.

## Ownership Transfer

Optionally, transfer ownership of the `ProxyAdmin` contract via the function `transferOwnership()`.