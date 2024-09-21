import { ethers } from 'ethers';

export const shortenAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEther = (wei) => {
  return ethers.formatEther(wei);
};

export const parseEther = (ether) => {
  return ethers.parseEther(ether);
};