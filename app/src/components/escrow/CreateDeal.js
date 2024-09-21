import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEscrowContract } from '../../hooks/useEscrowContract';
import { toast } from 'react-toastify';

const CreateDeal = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { createDeal } = useEscrowContract();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await createDeal(data.buyer, data.seller, data.amount);
      toast.success('Deal created successfully!');
      reset();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="buyer" className="block text-sm font-medium text-gray-700">Buyer Address</label>
        <input
          id="buyer"
          type="text"
          {...register("buyer", { required: "Buyer address is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.buyer && <p className="mt-1 text-sm text-red-600">{errors.buyer.message}</p>}
      </div>
      <div>
        <label htmlFor="seller" className="block text-sm font-medium text-gray-700">Seller Address</label>
        <input
          id="seller"
          type="text"
          {...register("seller", { required: "Seller address is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.seller && <p className="mt-1 text-sm text-red-600">{errors.seller.message}</p>}
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (ETH)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          {...register("amount", { required: "Amount is required", min: 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isLoading ? 'Creating...' : 'Create Deal'}
      </button>
    </form>
  );
};

export default CreateDeal;
