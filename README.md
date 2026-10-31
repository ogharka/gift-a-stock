# Gift a Stock 🎁

Wrap a slice of a tokenized stock in a link. Your friend opens the link, connects a wallet, and the shares land in their wallet. If they don't claim it in time, you can take it back.

This version runs on **Ink Sepolia, Ink's testnet**. Everything uses free play money.

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

## Setup on your Mac (one time, all free)

**1. Install Node.js.** Download the LTS version from nodejs.org and run the installer.

**2. Install the project.** Open Terminal, `cd` into this folder, and run:
```bash
npm install
npm test
```
You should see **8 passing**.

**3. Make a testnet-only wallet.** Install MetaMask in your browser and create a **new account just for testing**. Never put real money in it. To get its private key: MetaMask → account menu → Account details → Show private key.

**4. Get free test ETH on Ink Sepolia.** Search for an "Ink Sepolia faucet". The official Ink docs list some. Paste in your test wallet's address. You only need a tiny amount.

**5. Deploy.** In Terminal:
```bash
export PRIVATE_KEY=0xYOUR_TEST_WALLET_KEY
npm run deploy
```
It prints two addresses. Keep them.

> If the deploy can't connect, make a free account at alchemy.com, create an Ink Sepolia app, and run
> `export INK_SEPOLIA_RPC=https://ink-sepolia.g.alchemy.com/v2/YOUR_KEY` before deploying again.

**6. Open the web page.**
```bash
npm run web
```
Open the address it shows (http://localhost:8080). Go to the **Setup** tab and paste the two addresses. Then:
- **Connect wallet**. MetaMask will offer to add Ink Sepolia.
- **Get 10 free test shares**
- **Wrap the gift** → copy the link → open it in another browser or with a second MetaMask account → **Claim**.

**7. Put it online for free (optional).** Upload the `web` folder to GitHub Pages, Netlify, or Vercel. Each of them has a free plan.

---

## Files

| File | What it is |
|---|---|
| `contracts/GiftAStock.sol` | The gift contract. It works with any ERC-20 token, including xStocks tokens. |
| `contracts/MockStock.sol` | A free test "stock" for the testnet, with a mint button |
| `test/GiftAStock.test.js` | 8 automatic checks: claiming, copycat protection, double-claim, refunds |
| `scripts/deploy.js` | Deploys both contracts |
| `web/index.html` | The whole website in one file |

## Ideas for next steps
- **Email login:** let friends without a wallet claim with just an email (Privy and Dynamic have free tiers).
- **Gasless claims:** the contract already lets anyone submit the claim, so a helper can pay the gas for the recipient.
- **Real xStocks:** if xStocks tokens are live on Ink, point the page at their token addresses instead of the test token. Get the contract audited first.
- **Gift cards:** a pretty shareable image or QR code for the link.

⚠️ This code has not been audited. Keep it on the testnet until it has been reviewed.
