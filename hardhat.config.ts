import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
  mocha: {
    timeout: 3600000,
    color: true,
    failZero: Boolean(process.env.CI),
    forbidOnly: Boolean(process.env.CI),
    reporter: 'mocha-multi-reporters',
    reporterOption: {
      reporterEnabled: 'spec, mocha-junit-reporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: 'test-results.[hash].xml',
        includePending: true,
        outputs: true,
      },
    },
  },
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  defaultNetwork: "besu_local",
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
        // private key for 0x67D8d32E9Bf1a9968a5ff53B87d777Aa8EBBEe69
        "0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524",
        // private key for 0x05FbA803Be258049A27B820088bab1cAD2058871
        "0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7",
      ],
    },
    // besu local node
    besu_local: {
      url: "http://127.0.0.1:8544",
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
      gas: 1_000_000_000,
      timeout: 60_000,
      chainId: 1337,
      accounts: [
        // private keys are configured in the genesis file https://github.com/hyperledger/besu/blob/main/config/src/main/resources/dev.json#L20
        // private key for 0xf17f52151EbEF6C7334FAD080c5704D77216b732
        "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
        // private key for 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
        "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
      ],
    },
  },
};

export default config;
