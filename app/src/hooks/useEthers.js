import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { isSupported } from '../utils/constants';

export const useEthers = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const updateProviderAndSigner = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new BrowserProvider(window.ethereum, 'any');
      setProvider(provider);
      try {
        const signer = await provider.getSigner();
        setSigner(signer);
        console.log("Signer set successfully");
      } catch (error) {
        console.error("Error getting signer:", error);
        setSigner(null);
      }
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
      console.log("Chain ID updated:", Number(network.chainId));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    console.log("Connecting wallet...");
    if (typeof window.ethereum !== 'undefined' && !isConnecting) {
      setIsConnecting(true);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await updateProviderAndSigner();
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const newAccount = accounts[0] ? accounts[0].toString() : null;
        setAccount(newAccount);
        console.log("Wallet connected. Account:", newAccount);
        return newAccount;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setAccount(null);
      } finally {
        setIsConnecting(false);
      }
    } else if (typeof window.ethereum === 'undefined') {
      console.log('Please install MetaMask!');
    }
    return null;
  }, [isConnecting, updateProviderAndSigner]);


  const handleAccountsChanged = useCallback((accounts) => {
    console.log("Accounts changed:", accounts);
    const newAccount = accounts[0] ? accounts[0].toString() : null;
    setAccount(newAccount);
    updateProviderAndSigner();
  }, [updateProviderAndSigner]);

  const handleChainChanged = useCallback(() => {
    console.log("Chain changed. Reloading page.");
    updateProviderAndSigner();
  }, [updateProviderAndSigner]);

  useEffect(() => {
    console.log("useEffect in useEthers running");
    const initializeConnection = async () => {
      await updateProviderAndSigner();
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const newAccount = accounts[0].toString();
        setAccount(newAccount);
        console.log("Initial account set:", newAccount);
      } else {
        console.log("No accounts found, waiting for user to connect");
      }
    };

    initializeConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, updateProviderAndSigner]);

  return { 
    provider, 
    signer, 
    account, 
    chainId, 
    isSupported: useCallback(() => isSupported(chainId), [chainId]), 
    connectWallet,
    isConnecting
  };
};