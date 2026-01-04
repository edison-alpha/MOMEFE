import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { submitTransaction } from '@/lib/transactions';
import { toast } from 'sonner';
import { getExplorerUrl } from '@/lib/aptos';
import { triggerBalanceRefresh } from '@/hooks/useMovementBalance';

interface SendTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: string;
}

export const SendTokenModal = ({ open, onOpenChange, balance }: SendTokenModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();

  const handleSend = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast.error('Invalid input', {
        description: 'Please enter valid recipient address and amount',
      });
      return;
    }

    if (!authenticated || !user) {
      toast.error('Not authenticated', {
        description: 'Please connect your wallet first',
      });
      return;
    }

    setIsLoading(true);

    try {
      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (!moveWallet) {
        throw new Error('No Movement wallet found');
      }

      const walletAddress = moveWallet.address;
      const publicKey = moveWallet.publicKey;

      if (!signRawHash) {
        throw new Error('Signing function not available');
      }

      // Convert amount to octas (1 APT = 100,000,000 octas)
      const amountInOctas = Math.floor(parseFloat(amount) * 100_000_000);

      // Use aptos_account::transfer for native coin transfer
      const txHash = await submitTransaction(
        '0x1',
        'aptos_account::transfer',
        [recipient, amountInOctas],
        walletAddress,
        publicKey,
        signRawHash
      );

      toast.success('Transaction successful!', {
        description: `Sent ${amount} MOVE to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
        action: {
          label: 'View',
          onClick: () => window.open(getExplorerUrl(txHash), '_blank'),
        },
      });

      // Reset form
      setRecipient("");
      setAmount("");
      setMemo("");
      onOpenChange(false);
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error('Transaction failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    // Reserve some for gas fees
    const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
    setAmount(maxAmount.toFixed(4));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#1A1A1E] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Send Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Recipient Address</label>
            <Input
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-[#0f0f13] border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Amount</label>
              <span className="text-sm text-gray-400">Balance: {balance} MOVE</span>
            </div>
            <div className="bg-[#0f0f13] border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent border-none text-2xl font-bold text-white focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxAmount}
                    className="text-[#A04545] hover:text-[#8a3b3b] hover:bg-[#A04545]/10"
                  >
                    MAX
                  </Button>
                  <div className="flex items-center gap-2 bg-[#2A2A2E] px-3 py-2 rounded-lg">
                    <img
                      src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png"
                      alt="MOVE"
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-semibold">MOVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Memo (Optional)</label>
            <Input
              placeholder="Add a note..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="bg-[#0f0f13] border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          {amount && recipient && (
            <div className="bg-[#0f0f13] border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white font-medium">~0.001 MOVE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-white font-medium">
                  {(parseFloat(amount) + 0.001).toFixed(4)} MOVE
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-transparent border-white/10 text-white hover:bg-[#2A2A2E] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!recipient || !amount || parseFloat(amount) <= 0 || isLoading}
              className="flex-1 bg-[#A04545] text-white hover:bg-[#8a3b3b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
