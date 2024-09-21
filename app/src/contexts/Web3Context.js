import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEthers } from '../hooks/useEthers';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const { provider, signer, account, chainId, isSupported, connectWallet, isConnecting } = useEthers();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const updateBalance = async () => {
      if (provider && account) {
        const newBalance = await provider.getBalance(account);
        setBalance(newBalance);
      }
    };

    // Update balance on mount
    updateBalance();

    // Listen for new blocks
    provider?.on('block', updateBalance);

    // Clean up the listener
    return () => {
      provider?.off('block', updateBalance);
    };
  }, [provider, account]);


  return (
    <Web3Context.Provider value={{ 
      provider, 
      signer, 
      account,
      chainId,
      isSupported, 
      connectWallet,
      isConnecting,
      balance, 
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);