import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PrivyProvider } from '@privy-io/react-auth';
import { WalletProvider } from './components/WalletProvider';

createRoot(document.getElementById("root")!).render(
    <WalletProvider>
        <PrivyProvider
            appId="cmhixwk3s002ll50cofsyh1j8"
            config={{
                loginMethods: ['email', 'google', 'twitter', 'discord', 'github'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#A04545',
                },
            }}
        >
            <App />
        </PrivyProvider>
    </WalletProvider>
);
