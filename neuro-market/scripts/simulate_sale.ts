import { ethers } from "hardhat";

async function main() {
  console.log("🚀 STARTING UNIVERSAL TEST (Standard Download Mode)...");

  const signers = await ethers.getSigners();
  const seller = signers[0];
  const buyer = signers[1];

  // ⚠️ PASTE YOUR CURRENT ADDRESSES HERE ⚠️
  // (Copy them from your previous successful run or deploy terminal)
  const TOKEN_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const MARKET_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Connect Contracts
  const neuroToken = await ethers.getContractAt("NeuroToken", TOKEN_ADDR, seller) as any;
  const marketplace = await ethers.getContractAt("NeuroMarketV2", MARKET_ADDR, seller) as any;

  console.log("💸 Funding Buyer...");
  await neuroToken.transfer(buyer.address, ethers.parseEther("500"));

  // =========================================================
  // SCENARIO: Alice Publishes "Indie Pop Track" (Music)
  // =========================================================
  console.log("\n--- 1. Alice Publishes Music Data ---");
  
  const stakeAmount = ethers.parseEther("50");
  await neuroToken.approve(MARKET_ADDR, stakeAmount);

  // NOTE: We use the CID for the Music Track from your database.json
  // "QmMusicExampleHash123456..." -> "mode": "standard_download"
  const pubTx = await marketplace.publishDataset(
    "QmMusic111111111111111111111111111111111111111", 
    "Indie Pop Track - Summer Vibes", 
    "MUSIC", 
    ethers.parseEther("20") 
  );
  await pubTx.wait();
  console.log("✅ Music Track Published!");

  // Get the address of the NEW token (the Music Token)
  const allDatasets = await marketplace.getAllDatasets();
  const musicTokenAddr = allDatasets[allDatasets.length - 1]; // Get the very last one

  // =========================================================
  // SCENARIO: Bob Buys the Music
  // =========================================================
  console.log("\n--- 2. Bob Buys the Music ---");

  const price = ethers.parseEther("20");
  
  // Bob approves spending
  await neuroToken.connect(buyer).approve(MARKET_ADDR, price);

  console.log("⏳ Bob sending transaction...");
  const buyTx = await marketplace.connect(buyer).buyAccess(musicTokenAddr);
  await buyTx.wait();

  console.log("✅ PURCHASE COMPLETE! Check your Python Listener now.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});