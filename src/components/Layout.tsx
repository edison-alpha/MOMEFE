import { ReactNode } from "react";
import Navbar from "./Navbar";
import { RazorSwapBar } from "./RazorSwapBar";
import LiveTicker from "./LiveTicker";

interface LayoutProps {
  children: ReactNode;
  showTicker?: boolean;
}

const Layout = ({ children, showTicker = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showTicker && <LiveTicker />}
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-20">
        {children}
      </main>
      <RazorSwapBar />
    </div>
  );
};

export default Layout;
