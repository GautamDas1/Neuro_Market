import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1. Deploy Token
  const NeuroToken = await ethers.getContractFactory("NeuroToken");
  const neuroToken = await NeuroToken.deploy();
  await neuroToken.waitForDeployment();
  const tokenAddr = await neuroToken.getAddress();
  console.log("✅ NeuroToken deployed to:", tokenAddr);

  // 2. Deploy Marketplace V2 (UPDATED NAME)
  const NeuroMarketV2 = await ethers.getContractFactory("NeuroMarketV2");
  const marketplace = await NeuroMarketV2.deploy(tokenAddr);
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  
  console.log("✅ NeuroMarketV2 deployed to:", marketAddr);
  console.log("---------------------------------------");
  console.log("👉 UPDATE YOUR FILES WITH THESE ADDRESSES:");
  console.log("TOKEN_ADDR =", tokenAddr);
  console.log("MARKET_ADDR =", marketAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});