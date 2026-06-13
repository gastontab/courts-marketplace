// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {CourtNft} from "../src/CourtNft.sol";

contract DeployCourtNft is Script {
    function deployCourtNft() public returns (CourtNft) {
        vm.startBroadcast();
        CourtNft courtNft = new CourtNft();
        vm.stopBroadcast();
        return courtNft;
    }

    function run() external returns (address) {
        CourtNft courtNft = deployCourtNft();
        return address(courtNft);
    }
}
