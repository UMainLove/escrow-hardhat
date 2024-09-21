import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import EscrowContractABI from '../artifacts/contracts/Escrow_Wallet.sol/EscrowContract.json';
import { CONTRACT_ADDRESS } from '../utils/constants';

export const useEscrowContract = () => {
  const { provider, signer, account, isSupported, chainId } = useWeb3();
  const [contract, setContract] = useState(null);
  const [contractWithSigner, setContractWithSigner] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [disputeInitiators, setDisputeInitiators] = useState({});

  useEffect(() => {
    const initializeContract = async () => {
      console.log("Initializing contract. Provider:", !!provider, "Signer:", !!signer, "ChainId:", chainId, "Supported:", isSupported(chainId));
      if (provider && signer && isSupported(chainId)) {
        try {
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, EscrowContractABI.abi, provider);
          setContract(contractInstance);

          const contractWithSignerInstance = contractInstance.connect(signer);
          setContractWithSigner(contractWithSignerInstance);
          
          setIsInitialized(true);
          setIsReady(true);
          console.log("Contract initialized successfully");
        } catch (error) {
          console.error("Error initializing contract:", error);
          setIsInitialized(false);
          setIsReady(false);
        }
      } else {
        setIsInitialized(false);
        setIsReady(false);
        if (!isSupported(chainId)) {
          console.log("Current network is not supported");
        } else {
          console.log("Provider or signer not available");
        }
      }
    };

    initializeContract();
  }, [provider, signer, chainId, isSupported]);

  const getContractBalance = useCallback(async () => {
    if (!contract) throw new Error("Contract not initialized");
    const balance = await provider.getBalance(contract.getAddress());
    return balance;
  }, [contract, provider]);

  const createDeal = useCallback(async (buyer, seller, amount) => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    const amountInWei = ethers.parseEther(amount);
    const tx = await contractWithSigner.createDeal(buyer, seller, amountInWei, { value: amountInWei });
    await tx.wait();
    return tx;
  }, [contractWithSigner]);

  const escrowFund = useCallback(async (to, value) => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    const valueInWei = ethers.parseEther(value);
    const tx = await contractWithSigner.escrowFund(to, valueInWei);
    return tx;
  }, [contractWithSigner]);

   const escrowWithdraw = useCallback(async () => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    try {
      console.log("Initiating withdrawal");
      const receipt = await contractWithSigner.escrowWithdraw();
      console.log("Withdrawal transaction confirmed:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error in escrowWithdraw:", error);

      let errorMessage = "Failed to withdraw funds.";

      if (error.message.includes("ActionNotAllowed")) {
        errorMessage = "Cannot withdraw funds yet. Please wait until the withdrawal period (2 weeks) has passed.";
      } else if (error.message.includes("InvalidState")) {
        errorMessage = "Deal is not in the correct state for withdrawal.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "You are not authorized to withdraw funds for this deal.";
      } else if (error.message.includes("Failed to send Ether to seller")) {
        errorMessage = "Withdrawal failed: Unable to send funds to seller.";
      } else if (error.message.includes("Failed to send Ether to buyer")) {
        errorMessage = "Withdrawal failed: Unable to send funds to buyer.";
      } else if (error.message.includes("Failed to send Ether to escrow manager")) {
        errorMessage = "Withdrawal failed: Unable to send fee to escrow manager.";
      }
  
      throw new Error(errorMessage);
    }
  }, [contractWithSigner]);

  const escrowRefund = useCallback(async () => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    try {
      console.log("Initiating refund");
      const receipt = await contractWithSigner.escrowRefund();
      console.log("Refund transaction confirmed:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error in escrowRefund:", error);
      let errorMessage = 'Failed to refund deal.';
      if (error.message.includes('ActionNotAllowed')) {
        errorMessage =
          'Refund is not allowed yet. Please wait until the refund period (2 weeks) has passed.';
      } else if (error.message.includes('InvalidState')) {
        errorMessage = 'Deal is not in the correct state for refund.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'You are not authorized to refund this deal.';
      } else if (error.message.includes('AlreadyFunded')) {
        errorMessage = 'Cannot refund a deal that has been funded.';
      } else {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }, [contractWithSigner]);
  

  const openDispute = useCallback(async (dealId) => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    try {
      console.log("Initiating dispute for deal:", dealId);
      const receipt = await contractWithSigner.openDispute(dealId);
      console.log("Dispute transaction confirmed:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error in openDispute:", error);
      let errorMessage = "Failed to open dispute.";
      if (error.message.includes("InvalidState")) {
        errorMessage = "Cannot open a dispute. The deal is not in the 'Success' state.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "You are not authorized to open a dispute for this deal.";
      }
      throw new Error(errorMessage);
    }
  }, [contractWithSigner]);

  const getDeal = useCallback(async (dealId) => {
    if (!contract) throw new Error("Contract not initialized");
    const dealData = await contract.getDeal(dealId);
    return {
      id: dealId,
      buyer: dealData.buyer,
      seller: dealData.seller,
      amount: dealData.amount,
      state: dealData.state,
      timestamp: dealData.timestamp
    };
  }, [contract]);


  const getDealState = useCallback(async (dealId) => {
    if (!contract) throw new Error("Contract not initialized");
    return await contract.getDealState(dealId);
  }, [contract]);

  const approvePayment = useCallback(async (dealId, refundBuyer) => {
    if (!contractWithSigner) throw new Error("Contract not initialized");
    try {
      console.log(`Approving payment for deal ${dealId}, refundBuyer: ${refundBuyer}`);
      const receipt = await contractWithSigner.approvePayment(dealId, refundBuyer);
      console.log("approvePayment transaction confirmed:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error in approvePayment:", error);
      let errorMessage = "Failed to approve payment.";
      if (error.message.includes("InvalidState")) {
        errorMessage = "Cannot approve payment. The deal is not in the 'Dispute' state.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "You are not authorized to approve payments for this deal.";
      } else if (error.message.includes("Failed to send Ether to buyer")) {
        errorMessage = "Failed to refund buyer.";
      } else if (error.message.includes("Failed to send Ether to seller")) {
        errorMessage = "Failed to send payment to seller.";
      } else if (error.message.includes("Failed to send Ether to escrow manager")) {
        errorMessage = "Failed to send fee to escrow manager.";
      }
      throw new Error(errorMessage);
    }
  }, [contractWithSigner]);

  const getAllDeals = useCallback(async () => {
    console.log("getAllDeals called. Account:", account, "Contract:", contract, "Initialized:", isInitialized);
    if (!account) throw new Error("No account connected");
    if (!contract || !isInitialized) throw new Error("Contract not initialized");

    try {
      const filter = contract.filters.DealCreated();
      const events = await contract.queryFilter(filter);
      console.log("DealCreated events:", events);

      const dealIds = events.map((event) => event.args.dealId);
      console.log("All deal IDs:", dealIds);

      const deals = await Promise.all(dealIds.map(async (id) => {
        const dealData = await contract.getDeal(id);
        return {
          id,
          buyer: dealData.buyer,
          seller: dealData.seller,
          amount: dealData.amount,
          state: dealData.state,
          timestamp: dealData.timestamp
        };
      }));

      console.log("Fetched deals:", deals);
      return deals;
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  }, [account, contract, isInitialized]);

  const fetchDisputeInitiators = useCallback(async () => {
    if (!contract) return;
    try {
      const filter = contract.filters.DisputeOpened();
      const events = await contract.queryFilter(filter);
      const initiators = {};
      events.forEach((event) => {
        const dealId = event.args.dealId;
        const initiator = event.args.initiator;
        initiators[dealId] = initiator;
      });
      setDisputeInitiators(initiators);
    } catch (error) {
      console.error('Error fetching DisputeOpened events:', error);
    }
  }, [contract]);

  const listenToContractEvents = useCallback(() => {
    if (!contract) return () => {};
    const handleDisputeOpened = (dealId, initiator) => {
      console.log('DisputeOpened event:', dealId, initiator);
      setDisputeInitiators((prev) => ({
        ...prev,
        [dealId]: initiator,
      }));
    };

    contract.on('DisputeOpened', handleDisputeOpened);

    return () => {
      contract.off('DisputeOpened', handleDisputeOpened);
    };
  }, [contract]);

  const listenToManagerEvents = useCallback(() => {
    if (!contract) return () => {};
  
    const handlePaymentApproved = (dealId, payment, fee) => {
      console.log('PaymentApproved event:', dealId, payment, fee); 
    };
  
    const handleBuyerRefunded = (dealId, amount) => {
      console.log('BuyerRefunded event:', dealId, amount);
    };
  
    contract.on('PaymentApproved', handlePaymentApproved);
    contract.on('BuyerRefunded', handleBuyerRefunded);
  
    return () => {
      contract.off('PaymentApproved', handlePaymentApproved);
      contract.off('BuyerRefunded', handleBuyerRefunded);
    };
  }, [contract]);

  useEffect(() => {
    if (contract) {
      fetchDisputeInitiators();
    }
  }, [contract, fetchDisputeInitiators]);

  useEffect(() => {
    const unsubscribe = listenToContractEvents();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [listenToContractEvents]);

  useEffect(() => {
    const unsubscribe = listenToManagerEvents();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [listenToManagerEvents]);


  return {
    contract,
    contractWithSigner,
    createDeal,
    escrowFund,
    escrowRefund,
    openDispute,
    approvePayment,
    getDeal,
    getDealState,
    getAllDeals,
    escrowWithdraw,
    isInitialized,
    isReady,
    getContractBalance,
    disputeInitiators,
  };
};