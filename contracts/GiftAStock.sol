// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title Gift a Stock
/// @notice Lock a tokenized stock (any ERC-20, e.g. an xStocks token) behind a
///         one-time "gift key". The secret half of that key goes into a share
///         link. Whoever opens the link signs "send it to my address" with the
///         secret, so the gift can't be stolen by someone copying the claim
///         transaction. If nobody claims before the deadline, the sender can
///         take the gift back.
contract GiftAStock is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Gift {
        address sender;
        address token;
        uint256 amount;
        uint64 expiresAt;
        bool settled; // true once claimed or refunded
        string message;
    }

    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    /// @dev giftKey (public address of the one-time key) => gift
    mapping(address => Gift) public gifts;

    event GiftCreated(address indexed giftKey, address indexed sender, address indexed token, uint256 amount, uint64 expiresAt);
    event GiftClaimed(address indexed giftKey, address indexed recipient, uint256 amount);
    event GiftRefunded(address indexed giftKey, address indexed sender, uint256 amount);

    error GiftKeyInUse();
    error InvalidGift();
    error MessageTooLong();
    error AlreadySettled();
    error Expired();
    error NotExpired();
    error NotSender();
    error BadSignature();

    /// @notice Create a gift. Approve this contract for `amount` of `token` first.
    function createGift(
        address giftKey,
        address token,
        uint256 amount,
        uint64 expiresAt,
        string calldata message
    ) external nonReentrant {
        if (giftKey == address(0) || token == address(0) || amount == 0) revert InvalidGift();
        if (expiresAt <= block.timestamp) revert InvalidGift();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) revert MessageTooLong();
        if (gifts[giftKey].sender != address(0)) revert GiftKeyInUse();

        // Count what actually arrived, in case the token takes a transfer fee.
        uint256 before = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = IERC20(token).balanceOf(address(this)) - before;
        if (received == 0) revert InvalidGift();

        gifts[giftKey] = Gift(msg.sender, token, received, expiresAt, false, message);
        emit GiftCreated(giftKey, msg.sender, token, received, expiresAt);
    }

    /// @notice The exact message the gift key must sign to send the gift to `recipient`.
    function claimHash(address giftKey, address recipient) public view returns (bytes32) {
        return keccak256(abi.encode("GiftAStock:claim", block.chainid, address(this), giftKey, recipient));
    }

    /// @notice Claim a gift. Anyone may submit this (so a helper can pay the gas),
    ///         but the tokens only ever go to the recipient the gift key signed for.
    function claim(address giftKey, address recipient, bytes calldata signature) external nonReentrant {
        Gift storage g = gifts[giftKey];
        if (g.sender == address(0)) revert InvalidGift();
        if (g.settled) revert AlreadySettled();
        if (block.timestamp >= g.expiresAt) revert Expired();
        if (recipient == address(0)) revert InvalidGift();

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(claimHash(giftKey, recipient));
        if (ECDSA.recover(digest, signature) != giftKey) revert BadSignature();

        g.settled = true;
        IERC20(g.token).safeTransfer(recipient, g.amount);
        emit GiftClaimed(giftKey, recipient, g.amount);
    }

    /// @notice After the deadline, the sender can take back an unclaimed gift.
    function refund(address giftKey) external nonReentrant {
        Gift storage g = gifts[giftKey];
        if (g.sender == address(0)) revert InvalidGift();
        if (msg.sender != g.sender) revert NotSender();
        if (g.settled) revert AlreadySettled();
        if (block.timestamp < g.expiresAt) revert NotExpired();

        g.settled = true;
        IERC20(g.token).safeTransfer(g.sender, g.amount);
        emit GiftRefunded(giftKey, g.sender, g.amount);
    }
}
