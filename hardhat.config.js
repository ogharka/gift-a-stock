require("@nomicfoundation/hardhat-toolbox");

// Only used when the normal compiler download is blocked (set USE_LOCAL_SOLC=1).
// On your Mac you don't need this.
if (process.env.USE_LOCAL_SOLC) {
  const { subtask } = require("hardhat/config");
  const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");
  subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
    if (args.solcVersion !== "0.8.24") return runSuper();
    const p = require.resolve("solc/soljson.js");
    return { compilerPath: p, isSolcJs: true, version: "0.8.24", longVersion: require("solc").version() };
  });
}

// Your deployer wallet's private key goes in a .env-style environment variable,
// never in this file. Use a fresh wallet that only holds free testnet ETH.
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: {
    inkSepolia: {
      url: process.env.INK_SEPOLIA_RPC || "https://rpc-gel-sepolia.inkonchain.com",
      chainId: 763373,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
