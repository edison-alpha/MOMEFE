import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Check, X } from "lucide-react";

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateListingModal = ({ open, onOpenChange }: CreateListingModalProps) => {
  const [price, setPrice] = useState("100");
  const [ticketAmount, setTicketAmount] = useState("1,000");
  const [timeframe, setTimeframe] = useState("7 days");
  const [acknowledged, setAcknowledged] = useState(false);

  const itemPrice = parseFloat(price) || 0;
  const platformFee = itemPrice * 0.05;
  const youllReceive = itemPrice - platformFee;
  const pricePerTicket = ticketAmount ? (itemPrice / parseInt(ticketAmount.replace(/,/g, ""))).toFixed(4) : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-md border-primary/20 max-w-md p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 pb-3 border-b border-white/5 bg-white/5">
          <DialogTitle className="text-center font-mono tracking-wider text-lg font-bold">LIST YOUR ITEM</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-2xl">💎</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight truncate">vpass badge # 12888</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Verified Asset
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Floor</p>
              <p className="font-mono text-sm font-medium text-primary">0.45 ETH</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Listing Price</label>
              <div className="flex items-center gap-2 p-2.5 bg-input/50 rounded-lg border border-white/5 focus-within:border-primary/50 focus-within:bg-input transition-all">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 rounded">
                  <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-primary text-[9px] text-white font-bold">$</span>
                  <span className="text-xs font-bold text-primary">USDC</span>
                </div>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-lg text-right font-bold placeholder:text-muted-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Ticket Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tickets Info</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none p-2.5 bg-secondary rounded-lg border border-white/5 outline-none focus:border-primary/50 font-mono text-xs"
                    value={ticketAmount}
                    onChange={(e) => setTicketAmount(e.target.value)}
                  >
                    <option>1,000</option>
                    <option>2,500</option>
                    <option>5,000</option>
                    <option>10,000</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ticket Price</label>
                <div className="p-2.5 bg-secondary rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">per ticket</span>
                  <span className="font-mono text-sm font-bold text-primary">${pricePerTicket}</span>
                </div>
              </div>
            </div>

            {/* Timeframe */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
              <div className="relative">
                <select
                  className="w-full appearance-none p-2.5 bg-secondary rounded-lg border border-white/5 outline-none focus:border-primary/50 font-mono text-xs"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option>3 days</option>
                  <option>7 days</option>
                  <option>14 days</option>
                  <option>30 days</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-secondary/30 p-3 rounded-lg space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform Fee (5%)</span>
              <span className="font-mono text-red-400">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1.5 border-t border-white/5">
              <span className="font-medium">You Receive</span>
              <span className="font-mono font-bold text-primary">${youllReceive.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${acknowledged ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary"}`}
                onClick={() => setAcknowledged(!acknowledged)}>
                {acknowledged && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed select-none" onClick={() => setAcknowledged(!acknowledged)}>
                I agree to the terms of service. Once listed, the asset is locked until the raffle ends or is cancelled.
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="py-2.5 rounded-lg border border-white/10 hover:bg-white/5 font-mono tracking-wider transition-colors text-xs"
              >
                CANCEL
              </button>
              <button
                disabled={!acknowledged}
                className="py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold font-mono tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 text-xs"
              >
                CREATE RAFFLE
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal;
