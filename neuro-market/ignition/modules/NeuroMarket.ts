import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NeuroMarketModule = buildModule("NeuroMarketModule", (m) => {
  // 1. Deploy the Currency Token
  const neuroToken = m.contract("NeuroToken");

  // 2. Deploy the Marketplace (pass the Token address as constructor argument)
  const marketplace = m.contract("NeuroMarketplace", [neuroToken]);

  return { neuroToken, marketplace };
});

export default NeuroMarketModule;