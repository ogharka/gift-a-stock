// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Test stock token (TESTNET ONLY)
/// @notice A stand-in for a real xStocks token so you can practise for free.
///         Anyone can mint up to 10 tokens per call. It is worth nothing.
contract MockStock is ERC20 {
    uint256 public constant FAUCET_LIMIT = 10 ether; // 10 tokens (18 decimals)

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function faucet(uint256 amount) external {
        require(amount <= FAUCET_LIMIT, "max 10 per call");
        _mint(msg.sender, amount);
    }
}
