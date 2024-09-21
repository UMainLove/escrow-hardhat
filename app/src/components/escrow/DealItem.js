import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import { toast } from 'react-toastify';
import { useWeb3 } from '../../contexts/Web3Context';

const DealItem = ({ deal, account, onDealUpdated, disputeInitiator }) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getContractBalance, escrowWithdraw, escrowFund, escrowRefund, openDispute } = useEscrowContract();
  const { provider } = useWeb3();

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const updateCurrentTime = async () => {
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      setCurrentTime(block.timestamp);
    };

    updateCurrentTime();

    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [provider]);

  const stateMap = ['Inited', 'Running', 'Success', 'Closed', 'Dispute'];
  const dealStateNumber = Number(deal.state);

  const isBuyer = account && typeof account === 'string' && account.toLowerCase() === deal.buyer.toLowerCase();
  const isSeller = account && typeof account === 'string' && account.toLowerCase() === deal.seller.toLowerCase();
  const escrowManagerAddress = process.env.REACT_APP_ESCROW_MANAGER_ADDRESS;
  const isRunning = dealStateNumber === 1;
  const isSuccess = dealStateNumber === 2;

  const canFund = isRunning && isBuyer;
  const canWithdraw = isSuccess && isBuyer;
  const isRefundAllowed = isRunning && isBuyer && (currentTime >= Number(deal.timestamp) + 2 * 7 * 24 * 60 * 60);
  const isSellerWithdrawalAllowed = isSuccess && isSeller && (currentTime >= Number(deal.timestamp) + 2 * 7 * 24 * 60 * 60);
  const canOpenDispute = isSuccess && (isBuyer || isSeller);

  let disputeOpenedBy = '';

  if (disputeInitiator && dealStateNumber === 4) {
    if (disputeInitiator.toLowerCase() === deal.buyer.toLowerCase()) {
      disputeOpenedBy = 'Opened by Buyer';
    } else if (disputeInitiator.toLowerCase() === deal.seller.toLowerCase()) {
      disputeOpenedBy = 'Opened by Seller';
    } else {
      disputeOpenedBy = 'Opened by Unknown';
    }
  }

  console.log("Deal:", deal);
  console.log("Account:", account);
  console.log("Is Buyer:", isBuyer);
  console.log("Is Seller:", isSeller);
  console.log("Deal State:", dealStateNumber);
  console.log("Is Running:", isRunning);
  console.log("Is Success:", isSuccess);
  console.log("Can Withdraw:", canWithdraw);
  console.log("Can be refunded:", isRefundAllowed);
  console.log("Can withdraw after 2 weeks:", isSellerWithdrawalAllowed);
  console.log("Can Open Dispute:", canOpenDispute);

  const handleFund = useCallback(async () => {
    if (!canFund) return;
    try {
      const sellerAddress = deal.seller;
      const amountEth = ethers.formatEther(deal.amount);
      await escrowFund(sellerAddress, amountEth);
      toast.success("Deal funded successfully!");
      if (onDealUpdated) onDealUpdated(deal.id);
    } catch (error) {
      console.error("Error funding deal:", error);
      toast.error(`Failed to fund deal: ${error.message}`);
    }
  }, [canFund, deal.id, escrowFund, onDealUpdated, deal.seller, deal.amount]);

  const handleWithdraw = useCallback(async () => {
    if (!canWithdraw) return;
    setIsWithdrawing(true);
    try {
    const contractBalanceBefore = await getContractBalance();
    console.log("Contract balance before withdrawal:", ethers.formatEther(contractBalanceBefore), "ETH");
      
    const buyerBalanceBefore = await provider.getBalance(account);
    console.log("Buyer balance before withdrawal:", ethers.formatEther(buyerBalanceBefore), "ETH");

    const receipt = await escrowWithdraw();
    console.log("Withdrawal transaction confirmed:", receipt.transactionHash);

    const buyerBalanceAfter = await provider.getBalance(account);
    console.log("Buyer balance after withdrawal:", ethers.formatEther(buyerBalanceAfter), "ETH");

    const contractBalanceAfter = await getContractBalance();
    console.log("Contract balance after withdrawal:", ethers.formatEther(contractBalanceAfter), "ETH");

    const balanceDifference = buyerBalanceBefore - buyerBalanceAfter ;
    console.log("Balance difference:", ethers.formatEther(balanceDifference), "ETH");
    const contractBalanceDifference = contractBalanceBefore - contractBalanceAfter;
    console.log("Contract balance changed by:", ethers.formatEther(contractBalanceDifference), "ETH");
    
    toast.success("Funds withdrawn successfully!");
    if (onDealUpdated) onDealUpdated(deal.id);

    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error(`Failed to withdraw funds: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  }, [canWithdraw, account, deal.id, escrowWithdraw, onDealUpdated, provider, getContractBalance]);

  const handleRefund = useCallback(async () => {
    if (!isRefundAllowed) return;

    setIsWithdrawing(true); 
    try {
      const buyerBalanceBefore = await provider.getBalance(account);
      console.log("Buyer balance before refund:", ethers.formatEther(buyerBalanceBefore), "ETH");

      const contractBalanceBefore = await getContractBalance();
      console.log("Contract balance before refund:", ethers.formatEther(contractBalanceBefore), "ETH");

      const receipt = await escrowRefund();
      console.log("Refund transaction confirmed:", receipt.transactionHash);

      const buyerBalanceAfter = await provider.getBalance(account);
      console.log("Buyer balance after refund:", ethers.formatEther(buyerBalanceAfter), "ETH");

      const contractBalanceAfter = await getContractBalance();
      console.log("Contract balance after refund:", ethers.formatEther(contractBalanceAfter), "ETH");

      const buyerBalanceDiff = buyerBalanceBefore - buyerBalanceAfter;
      console.log("Buyer balance increased by:", ethers.formatEther(buyerBalanceDiff), "ETH");

      const contractBalanceDiff = contractBalanceBefore - contractBalanceAfter;
      console.log("Contract balance changed by:", ethers.formatEther(contractBalanceDiff), "ETH");

      toast.success("Refund successful!");
      if (onDealUpdated) onDealUpdated(deal.id);
    } catch (error) {
      console.error("Error refunding deal:", error);
      toast.error(`Failed to refund deal: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  }, [isRefundAllowed, account, deal.id, escrowRefund, onDealUpdated, provider, getContractBalance]);

  const handleSellerWithdraw = useCallback(async () => {
    if (!isSellerWithdrawalAllowed) return;
    setIsWithdrawing(true);
    try {
      if (!escrowManagerAddress) throw new Error("Escrow Manager address not available");

      const sellerBalanceBefore = await provider.getBalance(account);
      console.log("Seller balance before withdrawal:", ethers.formatEther(sellerBalanceBefore), "ETH");

      const escrowManagerBalanceBefore = await provider.getBalance(escrowManagerAddress);
      console.log("Escrow Manager balance before withdrawal:", ethers.formatEther(escrowManagerBalanceBefore), "ETH");

      const contractBalanceBefore = await getContractBalance();
      console.log("Contract balance before withdrawal:", ethers.formatEther(contractBalanceBefore), "ETH");

      const receipt = await escrowWithdraw();
      console.log("Withdrawal transaction confirmed:", receipt.transactionHash);

      const sellerBalanceAfter = await provider.getBalance(account);
      console.log("Seller balance after withdrawal:", ethers.formatEther(sellerBalanceAfter), "ETH");

      const escrowManagerBalanceAfter = await provider.getBalance(escrowManagerAddress);
      console.log("Escrow Manager balance after withdrawal:", ethers.formatEther(escrowManagerBalanceAfter), "ETH");

      const contractBalanceAfter = await getContractBalance();
      console.log("Contract balance after withdrawal:", ethers.formatEther(contractBalanceAfter), "ETH");

      const sellerBalanceDiff = sellerBalanceBefore - sellerBalanceAfter;
      console.log("Seller balance increased by:", ethers.formatEther(sellerBalanceDiff), "ETH");

      const escrowManagerBalanceDiff = escrowManagerBalanceBefore - escrowManagerBalanceAfter;
      console.log("Escrow Manager balance increased by:", ethers.formatEther(escrowManagerBalanceDiff), "ETH");

      const contractBalanceDiff = contractBalanceBefore - contractBalanceAfter;
      console.log("Contract balance changed by:", ethers.formatEther(contractBalanceDiff), "ETH");

      toast.success("Withdrawal successful!");
      if (onDealUpdated) onDealUpdated(deal.id);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      let errorMessage = "Failed to withdraw funds.";

      if (error.message.includes("ActionNotAllowed")) {
        errorMessage = "Cannot withdraw funds yet. Please wait until the withdrawal period (2 weeks) has passed.";
      } else if (error.message.includes("InvalidState")) {
        errorMessage = "Deal is not in the correct state for withdrawal.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "You are not authorized to withdraw funds for this deal.";
      }

      toast.error(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  }, [isSellerWithdrawalAllowed, account, deal.id, escrowWithdraw, onDealUpdated, provider, getContractBalance, escrowManagerAddress]);

  const handleOpenDispute = useCallback(async () => {
    if (!canOpenDispute) return;
    setIsProcessing(true);
    try {
      const receipt = await openDispute(deal.id);
      console.log("Dispute transaction confirmed:", receipt.transactionHash);

      toast.success("Dispute opened successfully!");
      if (onDealUpdated) onDealUpdated(deal.id);
    } catch (error) {
      console.error("Error opening dispute:", error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [canOpenDispute, deal.id, openDispute, onDealUpdated]);
  
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Deal ID: {deal.id}</h3>
      <p>Buyer: {deal.buyer}</p>
      <p>Seller: {deal.seller}</p>
      <p>Amount: {ethers.formatEther(deal.amount)} ETH</p>
      <p>State: {stateMap[dealStateNumber]}</p>
      {disputeOpenedBy && <p>{disputeOpenedBy}</p>}
      <p>Timestamp: {new Date(Number(deal.timestamp) * 1000).toLocaleString()}</p>

      {canFund && (
        <button 
          onClick={handleFund}
          className="bg-green-500 text-white px-4 py-2 rounded mt-2"
        >
          Confirm Deal
        </button>
      )}

      {canWithdraw && (
        <button 
          onClick={handleWithdraw}
          disabled={isWithdrawing}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isWithdrawing ? 'Withdrawing...' : 'Withdraw funds'}
        </button>
      )}
      
      {isRefundAllowed && (
        <button 
          onClick={handleRefund}
          disabled={isWithdrawing}
          className="bg-red-500 text-white px-4 py-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isWithdrawing ? 'Processing...' : 'Refund Deal'}
        </button>
      )}

      {isSellerWithdrawalAllowed && (
        <button 
          onClick={handleSellerWithdraw}
          disabled={isWithdrawing}
          className="bg-purple-500 text-white px-4 py-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isWithdrawing ? 'Processing...' : 'Withdraw Funds (Seller)'}
        </button>
      )}

      {canOpenDispute && (
        <button 
          onClick={handleOpenDispute}
          disabled={isProcessing}
          className="bg-yellow-500 text-white px-4 py-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isProcessing ? 'Processing...' : 'Open Dispute'}
        </button>
      )}

    </div>
  );
};

export default DealItem;