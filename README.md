# 🎲 MoME - Decentralized Multi-Asset Raffle Platform

> **First multi-asset raffle platform on Movement Network with verifiable randomness**

Platform raffle terdesentralisasi yang dibangun dengan Movement (Aptos Move) dan React + TypeScript. Mendukung Native MOVE, Fungible Assets, NFT, dan Real World Assets.

## 🏆 Hackathon Submission

| Document | Description |
|----------|-------------|
| [📋 Hackathon Submission](./docs/HACKATHON_SUBMISSION.md) | Complete project overview |
| [🎯 Pitch Deck](./docs/PITCH_DECK.md) | Presentation slides |
| [🔧 Technical Deep Dive](./docs/TECHNICAL_DEEP_DIVE.md) | Architecture & implementation |
| [⚡ Judges Quick Reference](./docs/JUDGES_QUICK_REFERENCE.md) | TL;DR for judges |

## 🌟 Features

- ✅ **Create Raffles** - Buat raffle dengan konfigurasi custom
- ✅ **Buy Tickets** - Beli tiket dengan AptosCoin
- ✅ **NFT-like Tickets** - Setiap tiket memiliki metadata IPFS unik
- ✅ **Target Amount System** - Minimum goal untuk raffle sukses
- ✅ **Verifiable Randomness** - Winner selection menggunakan Aptos Randomness API
- ✅ **Fair Fee Structure** - 10% (target met) / 5% (target unmet)
- ✅ **Escrow System** - Asset dan funds locked securely
- ✅ **Complete Lifecycle** - 5 status states (Listed, Raffling, Item Raffled, Fund Raffled, Cancelled)

## 🏗️ Tech Stack

### Smart Contract
- **Language**: Move (Aptos Move)
- **Network**: Movement / Aptos
- **Randomness**: Aptos Randomness API
- **Storage**: On-chain with IPFS metadata

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Wallet**: Privy (with Movement integration)
- **State Management**: React Hooks

## 📁 Project Structure

```
mome-platform/
├── contracts/                    # Smart contract
│   ├── sources/
│   │   ├── raffle.move          # Main contract
│   │   └── raffle_tests.move    # Unit tests
│   ├── scripts/
│   │   ├── deploy.sh            # Deployment script (Bash)
│   │   ├── deploy.ps1           # Deployment script (PowerShell)
│   │   ├── test.sh              # Test script (Bash)
│   │   ├── test.ps1             # Test script (PowerShell)
│   │   ├── verify.sh            # Verification script (Bash)
│   │   └── verify.ps1           # Verification script (PowerShell)
│   ├── Move.toml                # Package config
│   ├── README.md                # Contract docs
│   ├── QUICKSTART.md            # Quick start guide
│   ├── DEPLOYMENT_GUIDE.md      # Detailed deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md  # Deployment checklist
│   ├── TESTING_AND_DEPLOYMENT.md # Testing & deployment summary
│   └── DEPLOYMENT_SUMMARY.md    # Package summary
├── src/                         # Frontend source
│   ├── components/              # React components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities & services
│   └── services/                # API services
├── public/                      # Static assets
└── package.json                 # Dependencies

```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Aptos CLI
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd mome-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy Smart Contract

**Quick Deploy (5 minutes):**

```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Setup wallet
aptos init

# Get testnet tokens
aptos account fund-with-faucet --account <YOUR_ADDRESS>

# Deploy contract
cd contracts
./scripts/deploy.sh <YOUR_ADDRESS>
```

**Detailed Instructions:**
- See [contracts/QUICKSTART.md](./contracts/QUICKSTART.md) for quick start
- See [contracts/DEPLOYMENT_GUIDE.md](./contracts/DEPLOYMENT_GUIDE.md) for detailed guide
- See [contracts/DEPLOYMENT_SUMMARY.md](./contracts/DEPLOYMENT_SUMMARY.md) for package overview

### 4. Configure Frontend

Create `.env` file:

```env
VITE_CONTRACT_ADDRESS=<YOUR_DEPLOYED_ADDRESS>
VITE_NETWORK=testnet
PRIVY_APP_ID=<YOUR_PRIVY_APP_ID>
```

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
aptos move test --named-addresses raffle_hub=<YOUR_ADDRESS>

# Or use test script
./scripts/test.sh  # Linux/macOS
.\scripts\test.ps1 # Windows
```

### Frontend Tests

```bash
npm run test
```

## 📖 Documentation

### 🚀 Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Complete setup guide (START HERE!)
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick command reference
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Full documentation index

### 📋 Smart Contract
- [Contract README](./contracts/README.md) - Contract overview & API
- [Quick Start](./contracts/QUICKSTART.md) - 5-minute deployment guide
- [Deployment Guide](./contracts/DEPLOYMENT_GUIDE.md) - Comprehensive deployment
- [Deployment Checklist](./contracts/DEPLOYMENT_CHECKLIST.md) - Pre/post deployment checks
- [Testing & Deployment](./contracts/TESTING_AND_DEPLOYMENT.md) - Technical summary
- [Deployment Summary](./contracts/DEPLOYMENT_SUMMARY.md) - Package overview

### 🎯 Features & Specifications
- [Smart Contract Summary](./SMART_CONTRACT_SUMMARY.md) - Contract features
- [Deployment Info](./DEPLOYMENT.md) - Deployment information
- [Testing Complete](./TESTING_DEPLOYMENT_COMPLETE.md) - Package completion summary

## 🎮 How to Use

### Create a Raffle

1. Connect your wallet
2. Click "Create Raffle"
3. Fill in raffle details:
   - Title & description
   - Image URL
   - Ticket price
   - Total tickets
   - Target amount
   - Duration
4. Submit transaction

### Buy Tickets

1. Browse active raffles
2. Select a raffle
3. Choose number of tickets
4. Confirm purchase
5. Receive NFT-like tickets with IPFS metadata

### Finalize Raffle

1. Wait for raffle to end
2. Click "Finalize"
3. Winner selected using verifiable randomness
4. Winner can claim prize

### Claim Prize

**If Target Met:**
- Winner claims the asset (NFT/Token)
- Seller receives 90% of funds

**If Target Unmet:**
- Winner receives 95% of raised funds
- Seller can claim back the asset

## 💰 Fee Structure

- **Target Met**: 10% platform fee
- **Target Unmet**: 5% platform fee
- **Cancelled**: 0% fee (full refund)

## 🔐 Security

- ✅ Verifiable randomness (Aptos Randomness API)
- ✅ Escrow system for funds
- ✅ Time-based expiration
- ✅ Access control (creator, admin)
- ✅ Status-based state machine
- ✅ Ticket limit enforcement

## 🌐 Networks

### Testnet
- Movement Testnet (Porto)
- Aptos Testnet

### Mainnet
- Movement Mainnet
- Aptos Mainnet

## 🛠️ Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Type Check

```bash
npm run type-check
```

## 📊 Contract Status

### Raffle Lifecycle

```
LISTED (1)
   ↓
   ├─→ RAFFLING (2)
   │      ↓
   │      ├─→ ITEM_RAFFLED (3)    [Target Met]
   │      ├─→ FUND_RAFFLED (4)    [Target Unmet]
   │      └─→ CANCELLED (5)        [No Sales]
   │
   └─→ CANCELLED (5)               [Creator Cancel]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Check [documentation](./contracts/)
- Review [troubleshooting](./contracts/DEPLOYMENT_GUIDE.md#troubleshooting)
- Open an issue

## 🎯 Roadmap

- [x] Smart contract development
- [x] IPFS metadata integration
- [x] Frontend development
- [x] Wallet integration (Privy)
- [x] Testing & deployment scripts
- [ ] Mainnet deployment
- [ ] NFT asset integration
- [ ] Advanced analytics
- [ ] Mobile app

## 🙏 Acknowledgments

- [Movement Labs](https://movementlabs.xyz/) - Blockchain infrastructure
- [Aptos](https://aptos.dev/) - Move language & framework
- [Privy](https://privy.io/) - Wallet integration

---

**Built with ❤️ using Movement & React**
