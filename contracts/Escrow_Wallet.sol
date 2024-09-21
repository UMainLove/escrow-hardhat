// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./IERC5528.sol";

import "hardhat/console.sol";

contract EscrowContract is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, IERC5528 {
    enum State { Inited, Running, Success, Closed, Dispute }
    
    struct BalanceData {
        address addr;
        uint256 amount;
        uint256 timestamp;
    }

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        State state;
        uint256 timestamp;
    }

    address private escrowManager;

    mapping(bytes32 => Deal) private deals;
    mapping(address => bytes32[]) public buyerDeals;
    mapping(address => bytes32[]) public sellerDeals;
    mapping(bytes32 => bool) private dealFunded;

    uint256 private constant SERVICE_FEE_PERCENTAGE = 150; // 1.5%

    event EscrowInitialized(address indexed escrowManager);
    event DealCreated(bytes32 indexed dealId, address indexed buyer, address indexed seller, uint256 amount);
    event DealFunded(bytes32 indexed dealId, uint256 amount);
    event DisputeOpened(bytes32 indexed dealId, address indexed initiator);
    event PaymentApproved(bytes32 indexed dealId, uint256 amount, uint256 fee);
    event BuyerRefunded(bytes32 indexed dealId, uint256 amount);
    event InvalidManagerConnection(address indexed attemptedAddress);
    event ManagerConnected(address indexed managerAddress, uint256 contractBalance);
    event AutomaticRefundTriggered(bytes32 indexed dealId, uint256 amount, uint256 fee);
    event WithdrawalCompleted(bytes32 indexed dealId, address indexed recipient, uint256 amount, uint256 fee);

    error Unauthorized();
    error InvalidState();
    error InsufficientFunds();
    error AlreadyFunded();
    error DisputeAlreadyOpened();
    error ActionNotAllowed();
    error DealNotFound();
    error ZeroAmount();
    error BuyerSellerSame();
    error ZeroAddress();
    error DealAlreadyFunded();

    uint256 private dealNonce;

    function initialize(address _escrowManager) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        escrowManager = _escrowManager;
        console.log("EscrowContract initialized with manager:", escrowManager);
        emit EscrowInitialized(escrowManager);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    modifier onlyEscrowManager() {
        if (msg.sender != escrowManager) revert Unauthorized();
        _;
    }

    modifier onlyBuyerOrSeller(bytes32 dealId) {
        Deal storage deal = deals[dealId];
        if (msg.sender != deal.buyer && msg.sender != deal.seller) revert Unauthorized();
        _;
    }

    function createDeal(address buyer, address seller, uint256 amount) external payable nonReentrant returns (bytes32) {

        if (amount == 0) revert ZeroAmount();
        if (msg.value != amount) revert InsufficientFunds();
        if (seller == address(0) || seller == address(0)) revert ZeroAddress();
        if (buyer == seller) revert BuyerSellerSame();

        dealNonce++;

        bytes32 dealId = keccak256(abi.encodePacked(buyer, seller, amount, block.timestamp, dealNonce));
        deals[dealId] = Deal(buyer, seller, amount, State.Running, block.timestamp);
        buyerDeals[buyer].push(dealId);
        sellerDeals[seller].push(dealId);

        console.log("Deal created with ID:", uint256(dealId));
        console.log("Buyer:", msg.sender);
        console.log("Seller:", seller);
        console.log("Amount:", amount);
        console.log("Timestamp:", block.timestamp);
        console.log("Nonce:", dealNonce);

        emit DealCreated(dealId, buyer, seller, amount);
        return dealId;
    }

    function getDeal(bytes32 dealId) external view returns (Deal memory) {
    console.log("getDeal called with dealId:", uint256(dealId));

    Deal memory deal = deals[dealId];

    if (deal.buyer == address(0)) {
        console.log("DealNotFound error: buyer is zero address");
        revert DealNotFound();
    }
    console.log("Deal buyer:", deal.buyer);
    console.log("Deal seller:", deal.seller);
    console.log("Deal amount:", deal.amount);
    console.log("Deal state:", uint(deal.state));
    console.log("Deal timestamp:", deal.timestamp);
    
    return deal;
}

    function findDealId(address buyer, address seller, uint256 amount, uint256 timestamp) internal view returns (bytes32) {
        bytes32[] storage buyerDealIds = buyerDeals[buyer];

    for (uint256 i = buyerDealIds.length; i > 0; i--) {
        bytes32 dealId = buyerDealIds[i - 1];
        Deal storage deal = deals[dealId];
       if (deal.seller == seller && deal.amount == amount && deal.timestamp <= timestamp) {
            return dealId;
        }
    }
    revert DealNotFound();
    }
    
    function escrowFund(address _to, uint256 _value) external override nonReentrant returns (bool) {
    console.log("escrowFund called with _to:", _to, "and _value:", _value);

    if (_value == 0) {
    console.log("InsufficientFunds error - Not enough funds", _value); 
    revert InsufficientFunds();
    }

    bytes32 dealId = findDealId(msg.sender, _to, _value, block.timestamp);
    Deal storage deal = deals[dealId];

    console.log("escrowFund called with dealId:", uint256(dealId));
    console.log("Deal found - Buyer:", deal.buyer);
    console.log("Deal found - Seller:", deal.seller);
    console.log("Deal found - Amount:", deal.amount);
    console.log("Deal found - State:", uint(deal.state));
    
    if (deal.buyer != msg.sender || deal.seller != _to || deal.amount != _value) {
        console.log("DealNotFound error");
        console.log("Expected buyer:", msg.sender);
        console.log("Expected seller:", _to);
        console.log("Expected amount:", _value);
        revert DealNotFound();
    }
    if (dealFunded[dealId]) {
        console.log("AlreadyFunded error - Timestamp:", deal.timestamp);
        revert AlreadyFunded();
    }
    if (deal.state != State.Running) {
        console.log("InvalidState error - Current state:", uint(deal.state));
        revert InvalidState();
    } 
    
    deal.timestamp = block.timestamp;
    deal.state = State.Success;
     dealFunded[dealId] = true;
    
    console.log("Deal funded successfully");
    console.log("Amount:", deal.amount);
    console.log("Deal timestamp updated to:", deal.timestamp);
    console.log("New deal state:", uint(deal.state));

    emit DealFunded(dealId, deal.amount);
    console.log("DealFunded event emitted with dealId:", uint256(dealId), "and amount:", deal.amount);
    return true;
}

    function escrowRefund(address _from, uint256 _value) external override nonReentrant returns (bool) {
        console.log("escrowRefund called with _from:", _from, "and _value:", _value);

        bytes32 dealId = findDealId(msg.sender, _from, _value, block.timestamp);
        Deal storage deal = deals[dealId];

        console.log("escrowRefund called with dealId:", uint256(dealId));
        console.log("Deal found - Buyer:", deal.buyer);
        console.log("Deal found - Seller:", deal.seller);
        console.log("Deal found - Amount:", deal.amount);
        console.log("Deal found - State:", uint(deal.state));

        if (deal.buyer != msg.sender || deal.seller != _from || deal.amount != _value) {
        console.log("DealNotFound error");
        console.log("Expected buyer:", msg.sender);
        console.log("Expected seller:", _from);
        console.log("Expected amount:", _value);
        revert DealNotFound();
        }

        if (deal.state != State.Running) {
        console.log("InvalidState error - Current state:", uint(deal.state));
        revert InvalidState();
        }
        if (dealFunded[dealId]) {
        console.log("AlreadyFunded error - Cannot refund a funded deal");
        revert AlreadyFunded();
        }
        if (block.timestamp < deal.timestamp + 2 weeks) {
        console.log("ActionNotAllowed error - Refund not allowed before 2 weeks");
        revert ActionNotAllowed();
    }
        
        deal.state = State.Closed;
        dealFunded[dealId] = false;
        
        (bool sent, ) = payable(_from).call{value: _value}("");
        require(sent, "Failed to send Ether to buyer");
        
        console.log("Buyer refunded for deal ID:", uint256(dealId));
        console.log("Refund amount:", _value);

        emit BuyerRefunded(dealId, _value);
        return true;
    }

    function findDealForWithdrawal(address user) internal view returns (bytes32) {
    bytes32[] storage userDeals = buyerDeals[user].length > 0 ? buyerDeals[user] : sellerDeals[user];
    for (uint i = 0; i < userDeals.length; i++) {
        Deal storage deal = deals[userDeals[i]];
        if (deal.state == State.Success && (user == deal.seller || user == deal.buyer)) {
            return userDeals[i];
        }
    }
    revert DealNotFound();
    }

    function escrowWithdraw() external override nonReentrant returns (bool) {

        bytes32 dealId = findDealForWithdrawal(msg.sender);
        Deal storage deal = deals[dealId];

        if (deal.state != State.Success) revert InvalidState();

        if (msg.sender == deal.seller) {
        if (block.timestamp < deal.timestamp + 2 weeks) revert ActionNotAllowed();
        
        uint256 fee = (deal.amount * SERVICE_FEE_PERCENTAGE) / 10000;
        uint256 payment = deal.amount - fee;
       
        // Transfer payment to seller
        (bool sentToSeller, ) = deal.seller.call{value: payment}("");
        require(sentToSeller, "Failed to send Ether to seller");

        // Transfer fee to escrow manager
        (bool sentToManager, ) = escrowManager.call{value: fee}("");
        require(sentToManager, "Failed to send Ether to escrow manager");

        console.log("Withdrawal successful for deal ID:", uint256(dealId));
        console.log("Payment amount:", payment);
        console.log("Fee to escrow manager:", fee);

        emit WithdrawalCompleted(dealId, deal.seller, payment, fee);

    } else if (msg.sender == deal.buyer) {
       // Transfer amount back to buyer
        (bool sentToBuyer, ) = deal.buyer.call{value: deal.amount}("");
        require(sentToBuyer, "Failed to send Ether to buyer");


        console.log("Withdrawal successful for deal ID:", uint256(dealId));
        console.log("Payment amount:", deal.amount);

        emit WithdrawalCompleted(dealId, deal.buyer, deal.amount, 0);
    } else {
        revert Unauthorized();
    }
        deal.state = State.Closed;

        return true;
    }

    function openDispute(bytes32 dealId) external onlyBuyerOrSeller(dealId) {

        Deal storage deal = deals[dealId];

        if (deal.state != State.Success) {
        console.log("InvalidState error - Current state:", uint(deal.state));
         revert InvalidState();
        }

        deal.state = State.Dispute;

        console.log("Dispute opened for deal ID:", uint256(dealId));
        console.log("Dispute initiator:", msg.sender);

        emit DisputeOpened(dealId, msg.sender);
    }

    function approvePayment(bytes32 dealId, bool refundBuyer) external onlyEscrowManager nonReentrant {

        Deal storage deal = deals[dealId];

        if (deal.state != State.Dispute) revert InvalidState();

        uint256 fee = (deal.amount * SERVICE_FEE_PERCENTAGE) / 10000;
        uint256 payment = deal.amount - fee;


        if (refundBuyer) {
       // Transfer amount back to buyer
        (bool sentToBuyer, ) = deal.buyer.call{value: deal.amount}("");
        require(sentToBuyer, "Failed to send Ether to buyer");

        emit BuyerRefunded(dealId, deal.amount);
        
        console.log("Buyer refunded for deal ID:", uint256(dealId));
        console.log("Refunded amount:", deal.amount);
    } else {
        // Transfer payment to seller
        (bool sentToSeller, ) = deal.seller.call{value: payment}("");
        require(sentToSeller, "Failed to send Ether to seller");

        // Transfer fee to escrow manager
        (bool sentToManager, ) = escrowManager.call{value: fee}("");
        require(sentToManager, "Failed to send Ether to escrow manager");

        emit PaymentApproved(dealId, payment, fee);

        console.log("Payment approved for deal ID:", uint256(dealId));
        console.log("Approved amount:", payment);
        console.log("Fee amount:", fee);
    }
        deal.state = State.Closed;
    }

    function automaticRefund(bytes32 dealId) external nonReentrant {

        Deal storage deal = deals[dealId];

    if (deal.state != State.Success) {
        console.log("InvalidState error - Current state:", uint(deal.state));
        revert InvalidState();
    }
    if (block.timestamp < deal.timestamp + 2 weeks) {
        console.log("ActionNotAllowed error - Not enough time has passed");
        revert ActionNotAllowed();
    }

        uint256 fee = (deal.amount * SERVICE_FEE_PERCENTAGE) / 10000;
        uint256 refund = deal.amount - fee;
        
        // Transfer fee to escrow manager
        (bool sentToManager, ) = escrowManager.call{value: fee}("");
        require(sentToManager, "Failed to send Ether to escrow manager");

        // Transfer amount back to buyer
        (bool sentToBuyer, ) = deal.buyer.call{value: refund}("");
        require(sentToBuyer, "Failed to send Ether to buyer");

        
        deal.state = State.Closed;

        console.log("Automatic refund triggered for deal ID:", uint256(dealId));
        console.log("Refund amount:", refund);
        console.log("Fee amount:", fee);

        emit AutomaticRefundTriggered(dealId, refund, fee);
    }

    function connectManager() external {

        if (msg.sender != escrowManager) {
            console.log("Invalid manager connection attempt from:", msg.sender);

            emit InvalidManagerConnection(msg.sender);
        } else {
            console.log("Manager connected:", escrowManager);
            console.log("Contract balance:", address(this).balance);

            emit ManagerConnected(escrowManager, address(this).balance);
        }
    }

    function getDealState(bytes32 dealId) external view returns (State) {

        Deal storage deal = deals[dealId];

        if (deal.buyer == address(0)) revert DealNotFound();

        return deal.state;
    }

    function getContractBalance() external view onlyEscrowManager returns (uint256) {
    return address(this).balance;
}

    receive() external payable {
        console.log("Received payment:", msg.value);
    }

    fallback() external payable {
        console.log("Fallback function called with value:", msg.value);
    }
}