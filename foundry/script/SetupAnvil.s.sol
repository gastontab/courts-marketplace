// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DeployMarketplace} from "./DeployMarketplace.s.sol";
import {DeployCourtNft} from "./DeployCourtNft.s.sol";
import {MintAndListCourts} from "./MintAndListCourts.s.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract SetupAnvil is Script {
    DeployMarketplace deployMarketplace;
    DeployCourtNft deployCourtNft;
    MintAndListCourts mintAndListCourts;

    function run() external {
        deployMarketplace = new DeployMarketplace();
        deployCourtNft = new DeployCourtNft();
        mintAndListCourts = new MintAndListCourts();

        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        vm.stopBroadcast();

        console.log("USDC deployed at: ", address(usdc));

        address marketplaceAddy = address(deployMarketplace.deployMarketplace(address(usdc)));
        console.log("Marketplace deployed at: ", marketplaceAddy);

        address tennisAddy = DeployCourtNft.run();
        console.log("CourtNft deployed at: ", tennisAddy);

        mintAndListCourts.MintAndListCourts(tennisAddy, marketplaceAddy);
        mintAndListCourts.MintAndListCourts(tennisAddy, marketplaceAddy);
        mintAndListCourts.MintAndListCourts(tennisAddy, marketplaceAddy);
        mintAndListCourts.MintAndListCourts(tennisAddy, marketplaceAddy);

        mintAndListCourts.justMintTennis(tennisAddy);

        address ANVIL_ONE = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address ANVIL_TEN = 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720;

        vm.startBroadcast();

        usdc.mint(ANVIL_ONE, 100e6);
        usdc.mint(ANVIL_TEN, 100e6);
        usdc.mint(ANVIL_ONE, 100e6);
        vm.stopBroadcast();
    }
}
