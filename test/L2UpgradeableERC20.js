const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

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
    const { abcToken, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    expect(await abcToken.getAddress()).to.be.not.null;
    expect(await sixDecimalsToken.getAddress()).to.be.not.null;
  });

  it("Should set the right metadata", async function () {
    const { abcToken, sixDecimalsToken } = await loadFixture(
      createTokenBeaconProxy
    );
    expect(await abcToken.name()).to.be.equal("AbcToken");
    expect(await abcToken.symbol()).to.be.equal("ABC");
    expect(await abcToken.decimals()).to.be.equal(18);
    expect(await sixDecimalsToken.name()).to.be.equal("sixDecimalsToken");
    expect(await sixDecimalsToken.symbol()).to.be.equal("SIX");
    expect(await sixDecimalsToken.decimals()).to.be.equal(6);
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
});

describe("BeaconProxy", function () {
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
