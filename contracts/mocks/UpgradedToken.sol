// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.20;

import {L2UpgradeableERC20} from "../L2UpgradeableERC20.sol";

contract UpgradedToken is L2UpgradeableERC20 {
    function isUpgraded() external pure returns (bool) {
        return true;
    }
}
