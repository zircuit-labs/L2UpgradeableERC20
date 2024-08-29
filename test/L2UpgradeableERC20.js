const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

/**
 * Combines multiple arrays using a given function.
 *
 * @param {Function} fn - The function to combine elements from all arrays.
 * @param {...Array} arrays - The arrays to combine.
 * @returns {Array} - A new array with the results of applying the function to elements from all arrays.
 */
function zipWith(fn, ...arrays) {
  // Determine the length of the shortest array to avoid out-of-bounds errors
  const length = Math.min(...arrays.map((array) => array.length));

  // Create a new array by applying the function to elements from all arrays
  return Array.from({ length }, (_, i) =>
    fn(...arrays.map((array) => array[i]))
  );
}

const initialUserBalance = 10000;
const remoteToken = "0xB82381A3fBD3FaFA77B3a7bE693342618240067b";

async function createTokenBeaconProxy() {
  const [admin, unknown] = await ethers.getSigners();

  const L2UpgradeableERC20 = await ethers.getContractFactory(
    "L2UpgradeableERC20"
  );

  // Deploy beacon token
  const l1TokenBeacon = await upgrades.deployBeacon(L2UpgradeableERC20);
  await l1TokenBeacon.waitForDeployment();

  const l2TokenBeacon = await upgrades.deployBeacon(L2UpgradeableERC20);
  await l2TokenBeacon.waitForDeployment();

  const bridge = admin.address;

  // Create tokens
  const abcToken = await upgrades.deployBeaconProxy(
    await l1TokenBeacon.getAddress(),
    L2UpgradeableERC20,
    [bridge, remoteToken, "AbcToken", "ABC", 18]
  );

  const sixDecimalsToken = await upgrades.deployBeaconProxy(
    await l1TokenBeacon.getAddress(),
    L2UpgradeableERC20,
    [bridge, remoteToken, "sixDecimalsToken", "SIX", 6]
  );

  // Create a new token implementation
  const UpgradedToken = await ethers.getContractFactory("UpgradedToken");
  const newImplementation = await UpgradedToken.deploy();
  await newImplementation.waitForDeployment();

  // Update l2TokenBeacon with new implementation
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await l2TokenBeacon.connect(admin).upgradeTo(newImplementation.getAddress());

  // Set initial balance
  await sixDecimalsToken
    .connect(admin)
    .mint(unknown.address, initialUserBalance);

  return {
    admin,
    unknown,
    l1TokenBeacon,
    l2TokenBeacon,
    newImplementation,
    UpgradedToken,
    abcToken,
    sixDecimalsToken,
  };
}

describe("L2UpgradeableERC20", function () {
  it("Should deploy L2UpgradeableERC20", async function () {
    const { admin, abcToken, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    expect(await abcToken.getAddress()).to.be.not.null;
    expect(await abcToken.balanceOf(admin.address)).to.be.equal(0);
    expect(await sixDecimalsToken.getAddress()).to.be.not.null;
    expect(await sixDecimalsToken.balanceOf(admin.address)).to.be.equal(0);
  });

  it("Should set the right metadata", async function () {
    const { admin, abcToken, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    expect(await abcToken.name()).to.be.equal("AbcToken");
    expect(await abcToken.symbol()).to.be.equal("ABC");
    expect(await abcToken.decimals()).to.be.equal(18);
    expect(await abcToken.REMOTE_TOKEN()).to.be.equal(remoteToken);
    expect(await abcToken.remoteToken()).to.be.equal(remoteToken);
    expect(await abcToken.l1Token()).to.be.equal(remoteToken);
    expect(await abcToken.BRIDGE()).to.be.equal(admin);
    expect(await abcToken.bridge()).to.be.equal(admin);
    expect(await abcToken.l2Bridge()).to.be.equal(admin);
    expect(await sixDecimalsToken.name()).to.be.equal("sixDecimalsToken");
    expect(await sixDecimalsToken.symbol()).to.be.equal("SIX");
    expect(await sixDecimalsToken.decimals()).to.be.equal(6);
    expect(await sixDecimalsToken.REMOTE_TOKEN()).to.be.equal(remoteToken);
    expect(await sixDecimalsToken.remoteToken()).to.be.equal(remoteToken);
    expect(await sixDecimalsToken.l1Token()).to.be.equal(remoteToken);
    expect(await sixDecimalsToken.BRIDGE()).to.be.equal(admin);
    expect(await sixDecimalsToken.bridge()).to.be.equal(admin);
    expect(await sixDecimalsToken.l2Bridge()).to.be.equal(admin);
  });

  it("Cannot be reinitialized", async function () {
    const { admin, abcToken } = await loadFixture(createTokenBeaconProxy);
    await expect(
      abcToken
        .connect(admin)
        .initialize(admin, remoteToken, "AbcToken", "ABC", 18)
    ).to.be.revertedWithCustomError(abcToken, "InvalidInitialization");
  });

  it("Should mint tokens", async function () {
    const { admin, unknown, abcToken } = await loadFixture(
      createTokenBeaconProxy
    );
    const amount = 100;
    await abcToken.connect(admin).mint(unknown.address, amount);
    expect(await abcToken.balanceOf(unknown.address)).to.be.equal(amount);
  });

  it("Should burn tokens", async function () {
    const { admin, unknown, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    const amount = 100;
    await sixDecimalsToken.connect(unknown).approve(admin.address, amount);
    await sixDecimalsToken.connect(admin).burn(unknown.address, amount);
    expect(await sixDecimalsToken.balanceOf(unknown.address)).to.be.equal(
      initialUserBalance - amount
    );
  });

  it("Should revert if mint/burn are called by an unknown address", async function () {
    const { unknown, abcToken } = await loadFixture(createTokenBeaconProxy);
    const amount = 100;
    await expect(abcToken.connect(unknown).mint(unknown.address, amount)).to.be
      .reverted;
    await expect(abcToken.connect(unknown).burn(unknown.address, amount)).to.be
      .reverted;
  });

  it("Should transfer tokens", async function () {
    const { admin, unknown, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    const amount = 100;
    await sixDecimalsToken.connect(unknown).transfer(admin.address, amount);
    expect(await sixDecimalsToken.balanceOf(unknown.address)).to.be.equal(
      initialUserBalance - amount
    );
    expect(await sixDecimalsToken.balanceOf(admin.address)).to.be.equal(amount);
  });

  it("Should not transfer tokens if balance is too low", async function () {
    const { admin, unknown, abcToken } = await loadFixture(
      createTokenBeaconProxy
    );
    const amount = 100;
    await expect(
      abcToken.connect(unknown).transfer(admin.address, amount)
    ).to.be.revertedWithCustomError(abcToken, "ERC20InsufficientBalance");
  });

  it("Should support ERC165 Interface", async function () {
    const { unknown, abcToken } = await loadFixture(createTokenBeaconProxy);
    // Get the interface IDs
    const iface1 = ethers.id("supportsInterface(bytes4)").substring(0, 10);
    const iface1Bytes4 = ethers.dataSlice(iface1, 0, 4);

    // Assert that iface1 matches IERC165's interfaceId
    const IERC165 = "0x01ffc9a7"; // IERC165 interface ID
    expect(iface1Bytes4).to.equal(IERC165);
    expect(await abcToken.connect(unknown).supportsInterface(iface1Bytes4)).to
      .be.true;

    // Calculate the combined interface ID
    const remoteTokenSelector =
      abcToken.interface.getFunction("remoteToken").selector;
    const bridgeSelector = abcToken.interface.getFunction("bridge").selector;
    const mintSelector = abcToken.interface.getFunction("mint").selector;
    const burnSelector = abcToken.interface.getFunction("burn").selector;

    // Compute the XOR of selectors
    const xorSelectors = zipWith(
      (remoteTokenByte, bridgeByte, mintByte, burnByte) =>
        remoteTokenByte ^ bridgeByte ^ mintByte ^ burnByte,
      ethers.getBytes(remoteTokenSelector),
      ethers.getBytes(bridgeSelector),
      ethers.getBytes(mintSelector),
      ethers.getBytes(burnSelector)
    ).slice(0, 4);

    // Get the bytes4
    const iface3 = ethers.concat(xorSelectors.map((e) => ethers.toBeHex(e)));

    const IOptimismMintableERC20 = "0xec4fc8e3"; // IOptimismMintableERC20 interface ID
    expect(iface3).to.equal(IOptimismMintableERC20);
    expect(await abcToken.supportsInterface(iface3)).to.be.true;
  });

  it("should permit and delegate with signature", async function () {
    const { unknown, abcToken } = await loadFixture(createTokenBeaconProxy);
    const noRoleUser = (await ethers.getSigners())[2].address;

    const permitDomain = {
      name: await abcToken.name(),
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await abcToken.getAddress(),
    };

    const value = ethers.parseEther("1");
    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1;
    const nonce = 0;

    const { v, r, s } = ethers.Signature.from(
      await unknown.signTypedData(
        permitDomain,
        {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        {
          owner: unknown.address,
          spender: noRoleUser,
          value: value,
          nonce: nonce,
          deadline: deadline,
        }
      )
    );

    // Call permit function
    await abcToken.permit(
      unknown.address,
      noRoleUser,
      value,
      deadline,
      v,
      r,
      s
    );

    // Assert allowance and nonce
    expect(await abcToken.allowance(unknown.address, noRoleUser)).to.equal(
      value
    );
    expect(await abcToken.nonces(unknown.address)).to.equal(1);
  });
});

describe("BeaconProxy", function () {
  it("Should have correct owner", async function () {
    const { admin, unknown, l1TokenBeacon, l2TokenBeacon } = await loadFixture(
      createTokenBeaconProxy
    );

    expect(await l1TokenBeacon.connect(admin).owner()).to.be.equal(
      admin.address
    );

    expect(await l2TokenBeacon.connect(admin).owner()).to.be.equal(
      admin.address
    );

    await l1TokenBeacon.connect(admin).transferOwnership(unknown.address);
    expect(await l1TokenBeacon.connect(admin).owner()).to.be.equal(
      unknown.address
    );

    await expect(
      l1TokenBeacon.connect(admin).transferOwnership(unknown.address)
    ).to.be.reverted;

    await l2TokenBeacon.connect(admin).transferOwnership(unknown.address);
    expect(await l2TokenBeacon.connect(admin).owner()).to.be.equal(
      unknown.address
    );

    await expect(
      l2TokenBeacon.connect(admin).transferOwnership(unknown.address)
    ).to.be.reverted;
  });

  it("Should enable upgrade of existing beacon proxy", async function () {
    const { admin, l1TokenBeacon, abcToken, newImplementation, UpgradedToken } =
      await loadFixture(createTokenBeaconProxy);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await l1TokenBeacon
      .connect(admin)
      .upgradeTo(await newImplementation.getAddress());
    expect(await l1TokenBeacon.implementation()).to.be.equal(
      await newImplementation.getAddress()
    );
    expect(
      await UpgradedToken.attach(await abcToken.getAddress()).isUpgraded()
    ).to.be.equal(true);
  });

  it("Should deploy new beacon proxy with the updated implementation", async function () {
    const { admin, l1TokenBeacon, abcToken, l2TokenBeacon, UpgradedToken } =
      await loadFixture(createTokenBeaconProxy);
    const newTokenBeaconProxy = await upgrades.deployBeaconProxy(
      await l2TokenBeacon.getAddress(),
      UpgradedToken,
      [
        admin.address,
        remoteToken,
        "NAME",
        "SYMBOL",
        18, // Decimals
      ]
    );
    expect(await newTokenBeaconProxy.isUpgraded()).to.be.equal(true);
  });

  it("Beacon upgrade should only be done by the owner", async function () {
    const { unknown, l1TokenBeacon, newImplementation } = await loadFixture(
      createTokenBeaconProxy
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await expect(
      l1TokenBeacon
        .connect(unknown)
        .upgradeTo(await newImplementation.getAddress())
    ).to.be.reverted;
  });
});
