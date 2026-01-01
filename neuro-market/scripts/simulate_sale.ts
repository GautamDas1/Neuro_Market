import { ethers } from "hardhat";

async function main() {
  console.log("🚀 STARTING SALE SIMULATION...");

  // 1. Setup Accounts
  const signers = await ethers.getSigners();
  const seller = signers[0];
  const buyer = signers[1];

  // 2. Define Addresses (These are verified correct)
const TOKEN_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MARKET_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  // 3. Connect Contracts
  const neuroToken = await ethers.getContractAt("NeuroToken", TOKEN_ADDR, seller);
  const marketplace = await ethers.getContractAt("NeuroMarketplace", MARKET_ADDR, seller);

  // 4. Fund the Buyer
  console.log("💸 Funding Buyer...");
  await neuroToken.transfer(buyer.address, ethers.parseEther("500"));

  // =========================================================
  // SCENARIO: Alice Publishes "Corn Disease Data"
  // =========================================================
  console.log("\n--- 1. Alice Publishing Data ---");
  
  // Alice approves staking amount
  const stakeAmount = ethers.parseEther("50");
  await neuroToken.approve(MARKET_ADDR, stakeAmount);

  // Alice publishes
  const pubTx = await marketplace.publishDataset(
    "QmTestHash123", 
    "Corn Disease Set", 
    "CORN", 
    ethers.parseEther("100") 
  );
  await pubTx.wait();
  console.log("✅ Dataset Published!");

  // Get the new DataToken address
  const allDatasets = await marketplace.getAllDatasets();
  const newDataTokenAddr = allDatasets[allDatasets.length - 1];

  // =========================================================
  // SCENARIO: Bob Buys the Data
  // =========================================================
  console.log("\n--- 2. Bob Buying Data ---");

  const price = ethers.parseEther("100");
  
  // Bob must connect to the token contract to approve spending
  // We use .connect(buyer) to switch roles
  await neuroToken.connect(buyer).approve(MARKET_ADDR, price);

  console.log("⏳ Bob sending transaction...");
  const buyTx = await marketplace.connect(buyer).buyAccess(newDataTokenAddr);
  await buyTx.wait();

  console.log("✅ PURCHASE COMPLETE! Check your Python terminal now!");
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});