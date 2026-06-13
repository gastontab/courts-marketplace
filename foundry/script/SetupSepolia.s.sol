// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DeployMarketplace} from "./DeployMarketplace.s.sol";
import {DeployCourtNft} from "./DeployCourtNft.s.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract SetupSepolia is Script {
    DeployMarketplace deployMarketplace;
    DeployCourtNft deployCourtNft;

    function run() external {
        deployMarketplace = new DeployMarketplace();
        deployCourtNft = new DeployCourtNft();

        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        vm.stopBroadcast();
        console.log("MockUSDC deployed at: ", address(usdc));

        address marketplaceAddy = address(deployMarketplace.deployMarketplace(address(usdc)));
        console.log("Marketplace deployed at: ", marketplaceAddy);

        address tennisAddy = deployCourtNft.run();
        console.log("CourtNft deployed at: ", tennisAddy);

        vm.startBroadcast();
        usdc.mint(msg.sender, 1000e6);
        vm.stopBroadcast();
        console.log("Minted 1000 MockUSDC to deployer wallet:", msg.sender);
    }
}
