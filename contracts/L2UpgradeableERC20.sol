// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.20;

import {IOptimismMintableERC20} from "./interfaces/IOptimismMintableERC20.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";

/**
 * @title L2UpgradeableERC20 Contract
 * @notice ERC20 token created when a native token is bridged to a target chain.
 */
contract L2UpgradeableERC20 is ERC20PermitUpgradeable, IOptimismMintableERC20 {
    /// @notice Address of the corresponding version of this token on the remote chain.
    address public REMOTE_TOKEN;

    /// @notice Address of the StandardBridge on this network.
    address public BRIDGE;

    /// @notice Decimals of the token
    uint8 public DECIMALS;

    /**
     * @notice Initializes the L2UpgradeableERC20 contract.
     * @dev Disables OpenZeppelin's initializer mechanism for safety.
     */

    /// @dev Keep free storage slots for future implementation updates to avoid storage collision.
    uint256[50] private __gap;

    /// @notice Emitted whenever tokens are minted for an account.
    /// @param account Address of the account tokens are being minted for.
    /// @param amount  Amount of tokens minted.
    event Mint(address indexed account, uint256 amount);

    /// @notice Emitted whenever tokens are burned from an account.
    /// @param account Address of the account tokens are being burned from.
    /// @param amount  Amount of tokens burned.
    event Burn(address indexed account, uint256 amount);

    /// @notice A modifier that only allows the bridge to call
    modifier onlyBridge() {
        require(
            msg.sender == BRIDGE,
            "L2UpgradeableERC20: only bridge can mint and burn"
        );
        _;
    }

    /// @dev Disable constructor for safety
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _bridge,
        address _remoteToken,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Permit_init(_name);
        require(address(0) != _remoteToken);
        require(address(0) != _bridge);
        REMOTE_TOKEN = _remoteToken;
        BRIDGE = _bridge;
        DECIMALS = _decimals;
    }

    /// @notice Allows the StandardBridge on this network to mint tokens.
    /// @param _to     Address to mint tokens to.
    /// @param _amount Amount of tokens to mint.
    function mint(
        address _to,
        uint256 _amount
    ) external virtual override(IOptimismMintableERC20) onlyBridge {
        _mint(_to, _amount);
        emit Mint(_to, _amount);
    }

    /// @notice Allows the StandardBridge on this network to burn tokens.
    /// @param _from   Address to burn tokens from.
    /// @param _amount Amount of tokens to burn.
    function burn(
        address _from,
        uint256 _amount
    ) external virtual override(IOptimismMintableERC20) onlyBridge {
        _burn(_from, _amount);
        emit Burn(_from, _amount);
    }

    /// @notice ERC165 interface check function.
    /// @param _interfaceId Interface ID to check.
    /// @return Whether or not the interface is supported by this contract.
    function supportsInterface(
        bytes4 _interfaceId
    ) external pure virtual returns (bool) {
        bytes4 iface1 = type(ERC165Upgradeable).interfaceId;
        // Interface corresponding to the updated L2UpgradeableERC20 (this contract).
        bytes4 iface2 = type(IOptimismMintableERC20).interfaceId;
        return _interfaceId == iface1 || _interfaceId == iface2;
    }

    /// @custom:legacy
    /// @notice Legacy getter for the remote token. Use REMOTE_TOKEN going forward.
    function l1Token() public view returns (address) {
        return REMOTE_TOKEN;
    }

    /// @custom:legacy
    /// @notice Legacy getter for the bridge. Use BRIDGE going forward.
    function l2Bridge() public view returns (address) {
        return BRIDGE;
    }

    function remoteToken() public view returns (address) {
        return REMOTE_TOKEN;
    }

    /// @custom:legacy
    /// @notice Legacy getter for BRIDGE.
    function bridge() public view returns (address) {
        return BRIDGE;
    }

    /// @dev Returns the number of decimals used to get its user representation.
    /// For example, if `decimals` equals `2`, a balance of `505` tokens should
    /// be displayed to a user as `5.05` (`505 / 10 ** 2`).
    /// NOTE: This information is only used for _display_ purposes: it in
    /// no way affects any of the arithmetic of the contract, including
    /// {IERC20-balanceOf} and {IERC20-transfer}.
    function decimals() public view override returns (uint8) {
        return DECIMALS;
    }
}
