import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { ESCROW_MANAGER_ADDRESS } from '../utils/constants';

const Home = () => {
  const { account } = useWeb3();
  const escrowManagerAddress = ESCROW_MANAGER_ADDRESS;

  const isEscrowManager =
    account &&
    escrowManagerAddress &&
    account.toLowerCase() === escrowManagerAddress.toLowerCase();

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto bg-card border-default rounded-lg p-8 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to Escrow dApp
        </h1>
        <p className="mb-8 text-xl">
          Secure and transparent escrow services on the blockchain.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/deals"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition duration-200"
          >
            View Deals
          </Link>
          {isEscrowManager && (
            <Link
              to="/manager"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-md transition duration-200"
            >
              Manager Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
