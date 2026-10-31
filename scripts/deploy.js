// Deploys the gift contract and a free test stock token to Ink Sepolia.
// Run with:  npx hardhat run scripts/deploy.js --network inkSepolia
const { ethers, network } = require("hardhat");

async function main() {
  const [me] = await ethers.getSigners();
  if (!me) throw new Error("No wallet set. Run: export PRIVATE_KEY=0x... (a testnet-only wallet)");
  console.log(`Deploying from ${me.address} on ${network.name}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(me.address))} ETH\n`);

  const stock = await (await ethers.getContractFactory("MockStock")).deploy("Test Apple", "tAAPLx");
  await stock.waitForDeployment();

  const gifts = await (await ethers.getContractFactory("GiftAStock")).deploy();
  await gifts.waitForDeployment();

  console.log("Paste these into the web page's Setup tab:");
  console.log(`  GiftAStock contract:  ${await gifts.getAddress()}`);
  console.log(`  Test stock token:     ${await stock.getAddress()}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
