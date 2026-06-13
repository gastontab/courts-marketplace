// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract CourtNft is ERC721, Ownable {
    using Strings for uint256;

    error ERC721Metadata__URI_QueryFor_NonExistentToken();

    struct CourtFeatures {
        string outerColor;
        string innerColor;
        string lineColor;
    }

    /*//////////////////////////////////////////////////////////////
                            SVG PIECES
    //////////////////////////////////////////////////////////////*/
    string constant SVG_START = '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">';
    
    string constant OUTER_RECT_1 = '<rect width="300" height="300" fill="';
    
    string constant INNER_RECT_1 = '"/> <rect x="40" y="20" width="220" height="260" fill="';


    string constant COURT_LINES_1 = '"/> <g stroke="';
    string constant COURT_LINES_2 = '" stroke-width="2" fill="none">'
        '<rect x="40" y="20" width="220" height="260"/>'
        '<line x1="60" y1="20" x2="60" y2="280"/>'
        '<line x1="240" y1="20" x2="240" y2="280"/>'
        '<line x1="35" y1="150" x2="265" y2="150" stroke-width="4" stroke-dasharray="3,1"/>'
        '<line x1="60" y1="85" x2="240" y2="85"/>'
        '<line x1="60" y1="215" x2="240" y2="215"/>'
        '<line x1="150" y1="85" x2="150" y2="215"/>'
        '</g> </svg>';

    uint256 private s_tokenCounter;

    mapping(uint256 tokenId => string imageUri) private s_tokenIdToImageUri;
    mapping(uint256 tokenId => uint256 seed) private s_tokenIdToSeed;

    event CreatedNFT(uint256 indexed tokenId);

    constructor() ERC721("Grand Slam Court", "GSC") Ownable(msg.sender) {}

    function mintPlayer() public returns (uint256) {
        uint256 tokenCounter = s_tokenCounter;

        uint256 playerSeed = uint256(
            keccak256(abi.encodePacked(msg.sender, tokenCounter, block.number, block.timestamp))
        );

        string memory courtSvg = createSvgCourtFromSeed(playerSeed);
        string memory imageUri = svgToImageURI(courtSvg);

        _safeMint(msg.sender, tokenCounter);

        s_tokenIdToImageUri[tokenCounter] = imageUri;
        s_tokenIdToSeed[tokenCounter] = playerSeed;

        emit CreatedNFT(tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return tokenCounter;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURI = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURI, svgBase64Encoded));
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (ownerOf(tokenId) == address(0)) {
        revert ERC721Metadata__URI_QueryFor_NonExistentToken();
    }

    string memory imageURI = s_tokenIdToImageUri[tokenId];
    uint256 playerSeed = s_tokenIdToSeed[tokenId];
    
    uint256 speedStat = (playerSeed % 31) + 70;

    return
        string(
            abi.encodePacked(
                _baseURI(),
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name":"Stadium #', 
                            tokenId.toString(), //
                            '", ',
                            '"description":"A procedurally generated on-chain tennis court!", ',
                            '"attributes": [{"trait_type": "Court Speed", "value": ', 
                            speedStat.toString(), 
                            "}], ",
                            '"image":"', 
                            imageURI, 
                            '"}'
                        )
                    )
                )
            )
        );
}

    function generateColorFromSeed(uint256 seed) public pure returns (string memory) {
        bytes16 characters = "0123456789abcdef";
        bytes memory buffer = new bytes(7);
        buffer[0] = "#";
        for (uint256 i = 0; i < 6; i++) {
            uint8 hexDigit = uint8((seed >> (i * 8)) & 0xFF) % 16;
            buffer[i + 1] = bytes1(characters[hexDigit]);
        }
        return string(buffer);
    }

    function createSvgCourtFromSeed(uint256 playerSeed) public pure returns (string memory) {
        CourtFeatures memory features;

        features.outerColor = generateColorFromSeed(playerSeed);
        features.innerColor = generateColorFromSeed(
            uint256(keccak256(abi.encodePacked(playerSeed, uint256(1))))
        );
        
        features.lineColor = "#FFFFFF"; 

        return string.concat(
            SVG_START,
            OUTER_RECT_1,
            features.outerColor,
            INNER_RECT_1,
            features.innerColor,
            COURT_LINES_1,
            features.lineColor,
            COURT_LINES_2
        );
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}