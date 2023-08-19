import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    // hedera local node
    hedera_local: { 
      url: "http://127.0.0.1:7546",
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
      gas: 1_000_000_000,
      timeout: 60_000,
      chainId: 298,
      accounts: [
        // private keys
        "0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524",
        "0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7"
      ],
    },
     // besu local node
     besu_local: { 
      url: "http://127.0.0.1:8545",
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
      gas: 1_000_000_000,
      timeout: 60_000,
      chainId: 1337,
      accounts: [
        // private keys are configured in the genesis file 
        // private key for 0xf17f52151EbEF6C7334FAD080c5704D77216b732
        "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
        // private key for 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
        "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
      ],
    },
  },
};

export default config;