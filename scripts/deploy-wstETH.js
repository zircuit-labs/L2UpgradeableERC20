const { deploy } = require("./deploy");

async function main() {
  await deploy("Wrapped liquid staked Ether 2.0", "wstETH", 18);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
