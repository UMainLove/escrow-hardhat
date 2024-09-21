import React, { useEffect, useState, useCallback } from 'react';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import { useWeb3 } from '../../contexts/Web3Context';
import DealItem from './DealItem';
import { toast } from 'react-toastify';

const DealList = () => {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getAllDeals, getDeal, isReady, disputeInitiators } = useEscrowContract();
  const { account, isSupported, chainId } = useWeb3();

  const fetchDeals = useCallback(async () => {
    if (!isReady || !isSupported(chainId) || !account) {
      console.log("Not ready to fetch deals. Ready:", isReady, "Supported:", isSupported(chainId), "Account:", account);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching deals...");
      const fetchedDeals = await getAllDeals();
      console.log("Fetched deals:", fetchedDeals);
      setDeals(fetchedDeals.filter((deal) => 
        deal.buyer.toLowerCase() === account.toLowerCase() || 
        deal.seller.toLowerCase() === account.toLowerCase()
      ));
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch deals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAllDeals, isReady, isSupported, chainId, account]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleDealUpdated = useCallback(async (dealId) => {
    try {
      const updatedDeal = await getDeal(dealId);
      setDeals((prevDeals) =>
         prevDeals.map((deal) => 
        (deal.id === dealId ? updatedDeal : deal)
      ));
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal. Please refresh the page.');
    }
  }, [getDeal]);

  const renderDealItem = useCallback((deal) => {
    
    return (
      <DealItem
        key={deal.id}
        deal={deal}
        account={account}
        onDealUpdated={handleDealUpdated}
        disputeInitiator={disputeInitiators[deal.id]}
      />
    );
  }, [account, handleDealUpdated, disputeInitiators]);

  if (isLoading) {
    return <div className="text-center py-4">Loading deals...</div>;
  }
  if (!isSupported(chainId)) {
    return <div className="text-center py-4">Please connect to a supported network.</div>;
  }
  if (!account) {
    return <div className="text-center py-4">Please connect your wallet to view deals.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Your Deals</h2>
      {deals.length === 0 ? (
        <p className="text-center">No deals found.</p>
      ) : (
        deals.map(renderDealItem)
      )}
      <button 
        onClick={fetchDeals} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Deals
      </button>
    </div>
  );
};

export default DealList;