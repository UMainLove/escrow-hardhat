import React, { useState, useEffect, useCallback } from 'react';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import { useWeb3 } from '../../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { ESCROW_MANAGER_ADDRESS } from '../../utils/constants';

const ManagerDashboard = () => {
  const { account, isSupported, chainId } = useWeb3();
  const [disputedDeals, setDisputedDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { approvePayment, getAllDeals, isReady } = useEscrowContract();

  const escrowManagerAddress = ESCROW_MANAGER_ADDRESS;

  const isEscrowManager = account && escrowManagerAddress && account.toLowerCase() === escrowManagerAddress.toLowerCase();

  const fetchDisputedDeals = useCallback(async () => {
    if (!isReady || !isSupported(chainId) || !account || !isEscrowManager) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allDeals = await getAllDeals();
      const disputes = allDeals.filter(deal => Number(deal.state) === 4); // Assuming 'Dispute' state is index 4
      setDisputedDeals(disputes);
    } catch (error) {
      console.error('Error fetching disputed deals:', error);
      toast.error('Failed to fetch disputed deals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAllDeals, isReady, isSupported, chainId, account, isEscrowManager]);

  useEffect(() => {
    fetchDisputedDeals();
  }, [fetchDisputedDeals]);

  const handleApprovePayment = useCallback(async (dealId) => {
    try {
      await approvePayment(dealId, false); 
      toast.success('Payment approved successfully!');
      fetchDisputedDeals(); 
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error.message);
    }
  }, [approvePayment, fetchDisputedDeals]);

  const handleRefundBuyer = useCallback(async (dealId) => {
    try {
      await approvePayment(dealId, true); 
      toast.success('Buyer refunded successfully!');
      fetchDisputedDeals(); 
    } catch (error) {
      console.error('Error refunding buyer:', error);
      toast.error(error.message);
    }
  }, [approvePayment, fetchDisputedDeals]);

  if (!isEscrowManager) {
    return <div className="text-center py-4">Access denied. You are not the Escrow Manager.</div>;
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading disputed deals...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Disputed Deals</h2>
      {disputedDeals.length === 0 ? (
        <p className="text-center">No disputed deals at the moment.</p>
      ) : (
        disputedDeals.map(deal => (
          <div key={deal.id} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Deal ID: {deal.id}</h3>
            <p>Buyer: {deal.buyer}</p>
            <p>Seller: {deal.seller}</p>
            <p>Amount: {ethers.formatEther(deal.amount)} ETH</p>
            <p>Timestamp: {new Date(Number(deal.timestamp) * 1000).toLocaleString()}</p>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => handleApprovePayment(deal.id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Approve Payment to Seller
              </button>
              <button
                onClick={() => handleRefundBuyer(deal.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Refund Buyer
              </button>
            </div>
          </div>
        ))
      )}
      <button
        onClick={fetchDisputedDeals}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Disputed Deals
      </button>
    </div>
  );
};

export default ManagerDashboard;

