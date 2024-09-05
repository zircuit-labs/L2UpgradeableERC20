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

// deploy Governance contract
npx hardhat run scripts/deploy-gov.js --network zircuit
```

## Verification

The implementation contract can be verified on Zircuit Explorer using:

```
npx hardhat verify --network zircuit PROXY_CONTRACT
```

where `PROXY_CONTRACT` is the address of the Proxy contract that points to the token.

The governance contract can be verified on Zircuit Explorer using:

```
npx hardhat verify --network zircuit GOV_CONTRACT CONSTR_ARGS
```

where `GOV_CONTRACT` is the address of the governance contract, and `CONSTR_ARGS` are constructor arguments, e.g., `"0x4200000000000000000000000000000000000007" "0x3e40D73EB977Dc6a537aF587D48316feE66E9C8c" 0 86400 0 1 "0x0000000000000000000000000000000000000000"`