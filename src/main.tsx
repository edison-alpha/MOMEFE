import { Buffer } from 'buffer';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PrivyProvider } from '@privy-io/react-auth';
import { WalletProvider } from './components/WalletProvider';

// Polyfill Buffer untuk browser yang tidak support (seperti Edge)
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(
    <WalletProvider>
        <PrivyProvider
            appId={import.meta.env.VITE_PRIVY_APP_ID}
            config={{
                loginMethods: ['email', 'google', 'twitter', 'discord', 'github'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#A04545',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'all-users',
                    },
                },
            }}
        >
            <App />
        </PrivyProvider>
    </WalletProvider>
);
