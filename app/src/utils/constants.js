export const CONTRACT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
export const CHAIN_ID = 31337; // Hardhat
export const SUPPORTED_CHAINS = [1, 3, 4, 5, 42, 31337]; // Add or remove chain IDs as needed
export const ESCROW_MANAGER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export const isSupported = (chainId) => {
  console.log("Checking support for chainId:", chainId);
    return SUPPORTED_CHAINS.includes(Number(chainId));
  };