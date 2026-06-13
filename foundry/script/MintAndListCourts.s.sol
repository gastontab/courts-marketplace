// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CourtNft} from "../src/CourtNft.sol";
import {NftMarketplace} from "../src/NftMarketplace.sol";

contract MintAndListCourts is Script
{
    address s_tennisAddress;
    address s_marketplaceAddress;

    function MintAndListCourts(address tennisAddress, address marketplaceAddress) public {
        CourtNft tennis = CourtNft(tennisAddress);
        NftMarketplace marketplace = NftMarketplace(marketplaceAddress);

        vm.startBroadcast();

        uint256 tokenId = tennis.mintPlayer();
        console.log("Minted Tennis NFT Token ID:", tokenId);

        tennis.approve(marketplaceAddress, tokenId);

        marketplace.listItem(tennisAddress, tokenId, 10e6);

        vm.stopBroadcast();
    }

    function justMintTennis(address tennisAddress) public {
        CourtNft tennis = CourtNft(tennisAddress);

        vm.startBroadcast();

        tennis.mintPlayer();

        vm.stopBroadcast();
    }

    function run() external {
        MintAndListCourts(s_tennisAddress, s_marketplaceAddress);
    }
}
