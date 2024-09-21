import React, { useState } from 'react';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import { toast } from 'react-toastify';

const DealActions = ({ dealId, state }) => {
  const { escrowFund, openDispute, approvePayment } = useEscrowContract();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action, successMessage) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      console.error(`Error performing action:`, error);
      toast.error('Action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-x-2">
      {state === 'Running' && (
        <button
          onClick={() => handleAction(() => escrowFund(dealId), 'Deal funded successfully!')}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Processing...' : 'Fund Deal'}
        </button>
      )}
      {state === 'Success' && (
        <>
          <button
            onClick={() => handleAction(() => openDispute(dealId), 'Dispute opened successfully!')}
            disabled={isLoading}
            className="btn btn-warning"
          >
            {isLoading ? 'Processing...' : 'Open Dispute'}
          </button>
          <button
            onClick={() => handleAction(() => approvePayment(dealId, false), 'Payment approved successfully!')}
            disabled={isLoading}
            className="btn btn-success"
          >
            {isLoading ? 'Processing...' : 'Approve Payment'}
          </button>
        </>
      )}
    </div>
  );
};

export default DealActions;