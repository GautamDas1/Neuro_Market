import { ethers } from "hardhat";

async function main() {
  // 1. Deploy NeuroToken
  const neuroToken = await ethers.deployContract("NeuroToken");
  await neuroToken.waitForDeployment();
  console.log(`NeuroToken deployed to: ${await neuroToken.getAddress()}`);

  // 2. Deploy Marketplace (Pass Token Address to constructor)
  const marketplace = await ethers.deployContract("NeuroMarketplace", [await neuroToken.getAddress()]);
  await marketplace.waitForDeployment();
  console.log(`NeuroMarketplace deployed to: ${await marketplace.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});