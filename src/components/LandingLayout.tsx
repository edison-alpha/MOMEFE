import { ReactNode } from "react";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";

interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white overflow-x-hidden selection:bg-[#FCD34D] selection:text-black">
      <LandingNavbar />
      <main className="pt-14 md:pt-16">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;