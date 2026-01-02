// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DataToken.sol";

// NAME CHANGED TO V2
contract NeuroMarketV2 is ReentrancyGuard {
    IERC20 public neuroToken;
    uint256 public constant STAKE_AMOUNT = 50 * 10**18; 
    
    struct DatasetListing {
        address dataTokenAddress;
        address publisher;
        uint256 price;
        bool isActive;
        uint256 stakedAmount;
        string ipfsHash; 
    }

    mapping(address => DatasetListing) public listings;
    address[] public allDatasets;

    event DatasetPublished(address indexed dataToken, address indexed publisher, uint256 price);
    
    // THIS IS THE EVENT WE WANT
    event FilePurchased(address indexed buyer, string dataTokenURI);

    constructor(address _neuroTokenAddress) {
        neuroToken = IERC20(_neuroTokenAddress);
    }

    function publishDataset(
        string memory _ipfsHash, 
        string memory _name, 
        string memory _symbol, 
        uint256 _price
    ) external nonReentrant {
        require(neuroToken.balanceOf(msg.sender) >= STAKE_AMOUNT, "Insufficient NRO for stake");
        
        neuroToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT);

        DataToken newDataToken = new DataToken(_name, _symbol, _ipfsHash, msg.sender);

        listings[address(newDataToken)] = DatasetListing({
            dataTokenAddress: address(newDataToken),
            publisher: msg.sender,
            price: _price,
            isActive: true,
            stakedAmount: STAKE_AMOUNT,
            ipfsHash: _ipfsHash 
        });

        allDatasets.push(address(newDataToken));
        emit DatasetPublished(address(newDataToken), msg.sender, _price);
    }

    function buyAccess(address _dataTokenAddress) external nonReentrant {
        DatasetListing memory listing = listings[_dataTokenAddress];
        require(listing.isActive, "Dataset not active");
        
        uint256 price = listing.price;
        address seller = listing.publisher;

        require(neuroToken.transferFrom(msg.sender, seller, price), "Payment failed");
        
        // EMIT THE CID
        emit FilePurchased(msg.sender, listing.ipfsHash);
    }
    
    function getAllDatasets() external view returns (address[] memory) {
        return allDatasets;
    }
}
