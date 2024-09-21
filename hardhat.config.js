require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "paris",
    },
  }, 
  paths: {
    artifacts: "./app/src/artifacts",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      chainId: 31337
    },
  }
};
