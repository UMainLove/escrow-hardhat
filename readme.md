# Decentralized Escrow Application

This is an Escrow Dapp built with [Hardhat](https://hardhat.org/).


## Setup

Install dependencies in the top-level directory with `npm install`.

After you have installed hardhat locally, you can use commands to test and compile the contracts, among other things. To learn more about these commands run `npx hardhat help`.

Compile the contracts using `npx hardhat compile`. The artifacts will be placed in the `/app` folder, which will make it available to the front-end. This path configuration can be found in the `hardhat.config.js` file.

## Front-End

`cd` into the `/app` directory and run `npm install`

To run the front-end application run `npm start` from the `/app` directory. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

///////////////////
npm run start (in /app directory) = opens web app on localhost:3000
npx hardhat node = runs hardhat local node
Used Microsoft Edge browser with Metamask wallet in production 
///////////////////


## THIS DECENTRALIZED APPLICATION IS NOT INDEED TO BE USED FOR REAL-WORLD USAGES AS IT NEEDS THE PROPER CONFIGURATION TO SECURE THE SMART CONTRACT ADDRESS AND THE ESCROW MANAGER ADDRESS. IF YOU WANT TO USE IT FOR REAL USECASES ENSURE TO ADJUST PROPERLY THE SMART CONTRACT CODE.


## Escrow Wallet Audit 

Initialization and State Management
The contract is deployed with Hardhat Account n°0 as the Escrow Manager address.
The contract correctly initializes with the buyer and seller addresses and sets the state to Inited.
The initializeEscrow function transitions the state to Running and sets up the buyer's deposit.

Function Permissions
Dispute resolution is restricted to the Escrow Manager account via resolveDispute.

Token Transfers and Fees
The escrowWithdraw function calculates a 1.5% service fee correctly and transfers the appropriate amounts to the seller and Escrow Manager.
The resolveDispute function handles both approval of payment and refund scenarios, ensuring that the fee and transfer logic are properly managed.

State Transitions
State transitions are handled correctly, ensuring that the contract moves between Inited, Running, Success, and Closed states appropriately.
Conditions for state changes are well-defined, reducing the risk of unauthorized state transitions.
Remeber to approve a deal with a second smart contract interaction before opening a new deal with the same account.

Security Considerations
Reentrancy Protection: Ensure functions involving multiple state changes and transfers include reentrancy guards (e.g., using nonReentrant from OpenZeppelin's ReentrancyGuard).
Access Control: Confirm that only the designated roles (buyer, seller, Escrow Manager) can perform actions meant for them.
Timestamp Manipulation: Use block timestamps cautiously to avoid manipulation. Consider block numbers for more precision.
Error Handling: Ensure that all external calls and state changes handle errors appropriately.


Edge Cases and Testing
Test for edge cases, such as exact two-week boundary conditions, minimal and maximal token amounts, and various state transitions.
Ensure comprehensive unit and integration tests cover all paths, including dispute scenarios and early closure by the `Escrow Manager`.
