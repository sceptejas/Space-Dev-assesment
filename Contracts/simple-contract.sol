// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
contract sampleContract{
    string public name;
    uint public balance;
    function updateName(string memory _name) public {
        name = _name;
    }
    function getName() public view returns(string memory){
        return name;
    }
    function stake() public payable {
        balance += msg.value;
    }
    function withdraw() public {
        payable(msg.sender).transfer(balance);
        balance -= balance;
    }
    function getBalance() public view returns(uint){
        return balance;
    }
}