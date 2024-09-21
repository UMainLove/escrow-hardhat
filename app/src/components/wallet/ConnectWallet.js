import React from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { shortenAddress } from '../../utils/helpers';

const ConnectWallet = () => {
  const { connectWallet, account, isConnecting } = useWeb3();

  const handleConnect = async () => {
    if (!account) {
      await connectWallet();
    }
  };

  const displayAccount = account && typeof account === 'string' 
    ? `${shortenAddress(account.toString())}`
    : '';

  return (
    <button onClick={handleConnect} className="btn btn-primary" disabled={isConnecting}>
      {isConnecting
        ? 'Connecting...'
        : account 
          ? `Connected: ${displayAccount}` 
          : 'Connect Wallet'
      }
    </button>
  );
};

export default ConnectWallet;