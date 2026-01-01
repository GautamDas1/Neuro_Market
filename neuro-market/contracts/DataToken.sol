// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataToken is ERC20, Ownable {
    string public dataHash; 
    address public publisher;

    constructor(
        string memory name, 
        string memory symbol, 
        string memory _dataHash,
        address _publisher
    ) ERC20(name, symbol) Ownable(msg.sender) {
        dataHash = _dataHash;
        publisher = _publisher;
        _mint(_publisher, 100 * 10 ** decimals());
    }
}