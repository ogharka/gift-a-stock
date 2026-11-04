const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("GiftAStock", function () {
  const AMOUNT = ethers.parseEther("2.5");

  async function setup() {
    const [sender, friend, attacker] = await ethers.getSigners();
    const Stock = await ethers.getContractFactory("MockStock");
    const stock = await Stock.deploy("Test Apple", "tAAPLx");
    const Gifts = await ethers.getContractFactory("GiftAStock");
    const gifts = await Gifts.deploy();

    await stock.connect(sender).faucet(ethers.parseEther("10"));
    await stock.connect(sender).approve(await gifts.getAddress(), AMOUNT);

    const giftKey = ethers.Wallet.createRandom(); // the secret that goes in the link
    const expiresAt = (await time.latest()) + 7 * 24 * 3600;
    await gifts.connect(sender).createGift(giftKey.address, await stock.getAddress(), AMOUNT, expiresAt, "Happy birthday!");

    const sign = async (recipient) =>
      giftKey.signMessage(ethers.getBytes(await gifts.claimHash(giftKey.address, recipient)));

    return { sender, friend, attacker, stock, gifts, giftKey, expiresAt, sign };
  }

  it("records the deployer as the developer", async function () {
    const { gifts, sender } = await setup();
    expect(await gifts.developer()).to.equal(sender.address);
  });

  it("locks the stock and stores the message", async function () {
    const { gifts, stock, giftKey, sender } = await setup();
    const g = await gifts.gifts(giftKey.address);
    expect(g.sender).to.equal(sender.address);
    expect(g.amount).to.equal(AMOUNT);
    expect(g.message).to.equal("Happy birthday!");
    expect(await stock.balanceOf(await gifts.getAddress())).to.equal(AMOUNT);
  });

  it("lets the friend claim with the link's secret", async function () {
    const { gifts, stock, giftKey, friend, sign } = await setup();
    await expect(gifts.connect(friend).claim(giftKey.address, friend.address, await sign(friend.address)))
      .to.emit(gifts, "GiftClaimed").withArgs(giftKey.address, friend.address, AMOUNT);
    expect(await stock.balanceOf(friend.address)).to.equal(AMOUNT);
  });

  it("lets someone else pay the gas, but still pays the friend", async function () {
    const { gifts, stock, giftKey, friend, attacker, sign } = await setup();
    await gifts.connect(attacker).claim(giftKey.address, friend.address, await sign(friend.address));
    expect(await stock.balanceOf(friend.address)).to.equal(AMOUNT);
    expect(await stock.balanceOf(attacker.address)).to.equal(0);
  });

  it("blocks a copycat from redirecting the gift to themselves", async function () {
    const { gifts, giftKey, friend, attacker, sign } = await setup();
    const sigForFriend = await sign(friend.address);
    await expect(gifts.connect(attacker).claim(giftKey.address, attacker.address, sigForFriend))
      .to.be.revertedWithCustomError(gifts, "BadSignature");
  });

  it("can only be claimed once", async function () {
    const { gifts, giftKey, friend, sign } = await setup();
    const sig = await sign(friend.address);
    await gifts.claim(giftKey.address, friend.address, sig);
    await expect(gifts.claim(giftKey.address, friend.address, sig))
      .to.be.revertedWithCustomError(gifts, "AlreadySettled");
  });

  it("refuses refunds before the deadline", async function () {
    const { gifts, giftKey, sender } = await setup();
    await expect(gifts.connect(sender).refund(giftKey.address))
      .to.be.revertedWithCustomError(gifts, "NotExpired");
  });

  it("returns an unclaimed gift to the sender after the deadline", async function () {
    const { gifts, stock, giftKey, sender, friend, attacker, expiresAt, sign } = await setup();
    await time.increaseTo(expiresAt);
    await expect(gifts.connect(attacker).refund(giftKey.address))
      .to.be.revertedWithCustomError(gifts, "NotSender");
    await gifts.connect(sender).refund(giftKey.address);
    expect(await stock.balanceOf(sender.address)).to.equal(ethers.parseEther("10"));
    await expect(gifts.claim(giftKey.address, friend.address, await sign(friend.address)))
      .to.be.revertedWithCustomError(gifts, "AlreadySettled");
  });

  it("won't reuse a gift key or accept a 300-character message", async function () {
    const { gifts, stock, giftKey, sender } = await setup();
    const t = (await time.latest()) + 3600;
    await stock.approve(await gifts.getAddress(), AMOUNT);
    await expect(gifts.createGift(giftKey.address, await stock.getAddress(), AMOUNT, t, "again"))
      .to.be.revertedWithCustomError(gifts, "GiftKeyInUse");
    await expect(gifts.createGift(ethers.Wallet.createRandom().address, await stock.getAddress(), AMOUNT, t, "x".repeat(300)))
      .to.be.revertedWithCustomError(gifts, "MessageTooLong");
  });
});
