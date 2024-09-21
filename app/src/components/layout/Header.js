import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import ConnectWallet from '../wallet/ConnectWallet';
import { FaMoon, FaSun } from 'react-icons/fa';
import { ESCROW_MANAGER_ADDRESS } from '../../utils/constants';


const Header = ({ darkMode, setDarkMode }) => {
  const { account } = useWeb3();
  const escrowManagerAddress = ESCROW_MANAGER_ADDRESS;

  const isEscrowManager =
    account &&
    escrowManagerAddress &&
    account.toLowerCase() === escrowManagerAddress.toLowerCase();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          Escrow dApp
        </Link>
        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            Home
          </Link>
          <Link
            to="/deals"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            Deals
          </Link>
          {isEscrowManager && (
            <Link
              to="/manager"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              Manager
            </Link>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            {darkMode ? <FaSun className="text-yellow-500" /> : <FaMoon />}
          </button>
          <ConnectWallet />
        </nav>
      </div>
    </header>
  );
};

export default Header;