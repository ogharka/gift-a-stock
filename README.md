# Gift a Stock 🎁

Wrap a slice of a tokenized stock in a link. Your friend opens the link, connects a wallet, and the shares land in their wallet. If they don't claim it in time, you can take it back.

It works on **Ink Sepolia** (the free testnet) and **Ink mainnet**. Start on the testnet.

---

## How it works

1. You pick an amount and write a message.
2. The page makes a brand-new one-time **gift key** and locks your shares in the contract under that key.
3. The secret half of the key goes into the link, after the `#`. That part of a link never gets sent to any website's server.
4. Your friend opens the link. The page uses the secret to sign "send this gift to *my* wallet", and the contract checks that signature.
5. Because the signature names your friend's wallet, someone who copies their claim transaction **can't redirect it** to themselves.
6. After the deadline, only you can take an unclaimed gift back.

**Treat the link like cash:** anyone who has it can claim the gift.

---

## The easy way: no Terminal, no private key

1. Open the live site: **https://ogharka.github.io/gift-a-stock/**
2. Install **MetaMask** (free) if you haven't.
3. Pick **Testnet (free)** at the top. Get a little free test ETH from an "Ink Sepolia faucet".
4. **Setup tab** → **Deploy gift contract** → approve in MetaMask. Then **Deploy test stock** → approve.
5. **Send a gift tab** → **Get 10 free test shares** → **Wrap the gift** → copy the link.
6. Open the link in another browser, or with a second MetaMask account → **Claim**.

When the testnet run works, switch the picker to **Mainnet** and repeat step 4 with your own wallet. That costs a few cents of real ETH. On mainnet there's no test stock, so paste a real token's address under **Setup → Addresses**.

Your wallet signs everything in MetaMask, so the private key is never typed or pasted anywhere.

---

## For developers (optional)

```bash
npm install
npm test          # 9 contract checks
npm run export    # after changing a contract: refreshes web/bytecode.js for the Deploy buttons
npm run web       # serve the site at http://localhost:8080
```

`npm run deploy` deploys from Terminal instead, but it needs `PRIVATE_KEY` set, so only use it with a throwaway testnet wallet.

---

## Files

| File | What it is |
|---|---|
| `contracts/GiftAStock.sol` | The gift contract. It works with any ERC-20 token, including xStocks tokens. |
| `contracts/MockStock.sol` | A free test "stock" for the testnet, with a mint button |
| `test/GiftAStock.test.js` | 9 automatic checks: developer credit, claiming, copycat protection, double-claim, refunds |
| `scripts/deploy.js` | Deploys both contracts |
| `web/index.html` | The whole website, with Deploy, Send, Claim and Refund |
| `web/bytecode.js` | The compiled contracts the Deploy buttons use |
| `scripts/export-bytecode.js` | Rebuilds `web/bytecode.js` |

## Ideas for next steps
- **Email login:** let friends without a wallet claim with just an email (Privy and Dynamic have free tiers).
- **Gasless claims:** the contract already lets anyone submit the claim, so a helper can pay the gas for the recipient.
- **Real xStocks:** if xStocks tokens are live on Ink, point the page at their token addresses instead of the test token. Get the contract audited first.
- **Gift cards:** a pretty shareable image or QR code for the link.

⚠️ This code has not been audited. Keep it on the testnet until it has been reviewed.
