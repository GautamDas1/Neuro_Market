import { ethers } from "hardhat";

async function main() {
  console.log("🔍 STARTING DEBUGGER...");

  // 1. Setup Accounts
  const signers = await ethers.getSigners();
  const seller = signers[0];
  const buyer = signers[1];

  console.log(`👤 Seller: ${seller.address}`);
  console.log(`👤 Buyer:  ${buyer.address}`);

  // 2. Define Addresses
  // I have hardcoded them here. Do not change them for this test.
  const TOKEN_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const MARKET_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log("-------------------------------------------------");
  console.log(`Testing Token Address: [${TOKEN_ADDR}]`);
  console.log(`Testing Market Address: [${MARKET_ADDR}]`);
  console.log("-------------------------------------------------");

  // 3. Attempt Connection (One by one)
  console.log("👉 Attempting to connect to NeuroToken...");
  try {
    // We pass 'seller' as the 3rd argument to be very specific
    const neuroToken = await ethers.getContractAt("NeuroToken", TOKEN_ADDR, seller);
    console.log("✅ NeuroToken Connected!");
    
    console.log("👉 Attempting to connect to NeuroMarketplace...");
    const marketplace = await ethers.getContractAt("NeuroMarketplace", MARKET_ADDR, seller);
    console.log("✅ NeuroMarketplace Connected!");

    // 4. Check Balance (To prove it works)
    const balance = await neuroToken.balanceOf(seller.address);
    console.log(`💰 Seller Balance: ${ethers.formatEther(balance)} NRO`);

    console.log("🎉 SUCCESS! The connection is working.");

  } catch (error) {
    console.error("\n❌ CRASHED HERE!");
    console.error("The script failed while connecting to the contracts.");
    console.error("Double check: is the Contract Name 'NeuroToken' correct in NeuroToken.sol?");
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});