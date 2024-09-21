import React from 'react';
import { useEscrowContract } from '../../hooks/useEscrowContract';

const DisputeResolution = ({ dealId }) => {
  const { resolveDispute } = useEscrowContract();

  const handleResolve = (refundBuyer) => {
    resolveDispute(dealId, refundBuyer);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">Resolve Dispute</h3>
      <button onClick={() => handleResolve(false)} className="btn btn-primary mr-2">
        Approve Payment
      </button>
      <button onClick={() => handleResolve(true)} className="btn btn-secondary">
        Refund Buyer
      </button>
    </div>
  );
};

export default DisputeResolution;