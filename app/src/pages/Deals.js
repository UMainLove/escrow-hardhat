import React from 'react';
import CreateDeal from '../components/escrow/CreateDeal';
import DealList from '../components/escrow/DealList';

const Deals = () => {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Escrow Deals</h1>
      <CreateDeal />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Active Deals</h2>
        <DealList />
      </div>
    </div>
  );
};

export default Deals;