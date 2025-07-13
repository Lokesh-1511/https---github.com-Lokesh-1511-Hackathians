// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EscrowWithOTP {
address public owner;

enum Status { Pending, Completed, Refunded }

struct Deal {
    address payable farmer;
    address buyer;
    uint amount;
    bytes32 otpHash;
    uint timestamp;
    Status status;
}

uint public dealCounter = 0;
mapping(uint => Deal) public deals;

event DealCreated(uint dealId, address buyer, address farmer, uint amount);
event DealCompleted(uint dealId);
event DealRefunded(uint dealId);

modifier onlyOwner() {
    require(msg.sender == owner, "Not contract owner");
    _;
}

modifier onlyBuyer(uint dealId) {
    require(msg.sender == deals[dealId].buyer, "Not deal buyer");
    _;
}

constructor() {
    owner = msg.sender;
}

function createDeal(address payable farmer, bytes32 otpHash) external payable returns (uint dealId) {
    require(msg.value > 0, "Amount must be > 0");
    require(farmer != address(0), "Invalid farmer address");
    require(otpHash != "", "OTP hash required");

    dealId = dealCounter++;
    deals[dealId] = Deal({
        farmer: farmer,
        buyer: msg.sender,
        amount: msg.value,
        otpHash: otpHash,
        timestamp: block.timestamp,
        status: Status.Pending
    });

    emit DealCreated(dealId, msg.sender, farmer, msg.value);
}

function confirmDelivery(uint dealId, string memory otp) external onlyBuyer(dealId) {
    Deal storage d = deals[dealId];
    require(d.status == Status.Pending, "Already completed/refunded");
    require(keccak256(abi.encodePacked(otp)) == d.otpHash, "Incorrect OTP");

    d.status = Status.Completed;
    d.farmer.transfer(d.amount);

    emit DealCompleted(dealId);
}

function refundIfExpired(uint dealId) external {
    Deal storage d = deals[dealId];
    require(d.status == Status.Pending, "Not pending");
    require(block.timestamp >= d.timestamp + 3 days, "Not yet expired");

    d.status = Status.Refunded;
    payable(d.buyer).transfer(d.amount);

    emit DealRefunded(dealId);
}

// Helper to get deal info (for frontend)
function getDeal(uint dealId) external view returns (
    address farmer,
    address buyer,
    uint amount,
    Status status,
    uint timestamp
) {
    Deal memory d = deals[dealId];
    return (d.farmer, d.buyer, d.amount, d.status, d.timestamp);
}

}