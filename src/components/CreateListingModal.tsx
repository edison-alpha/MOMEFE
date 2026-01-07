import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Check, Loader2, Upload, Link, X, Image as ImageIcon } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { createRaffle } from '@/lib/raffle-contract';
import { createRaffleNative, createRaffleFA, ASSET_TYPE } from '@/lib/raffle-contract-v5';
import { uploadToPinata, isPinataConfiguredSync } from '@/lib/pinata';
import { createNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { invalidateRaffleQueries } from '@/lib/queryInvalidation';
import { useMovePrice } from '@/hooks/useMovePrice';
import { SUPPORTED_TOKENS, TokenInfo } from '@/lib/razor-swap';
import { triggerBalanceRefresh } from '@/hooks/useMovementBalance';
import { formatNumber } from '@/lib/utils';

interface AssetData {
  type: 'nft' | 'token';
  name: string;
  symbol?: string;
  image?: string;
  balance?: string;
  decimals?: number;
  floorPrice?: string;
  isNative?: boolean;
}

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: AssetData;
}

const CreateListingModal = ({ open, onOpenChange, asset }: CreateListingModalProps) => {
  const [price, setPrice] = useState("100");
  const [ticketAmount, setTicketAmount] = useState("1000");
  const [timeframe, setTimeframe] = useState("7 days");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New fields for customization
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [prizeAmountInput, setPrizeAmountInput] = useState("0");
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState("0"); // 0 = default 10%
  
  // Prize token selection - default to MOVE
  const [selectedPrizeToken, setSelectedPrizeToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  // Image upload states
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedIpfsUrl, setUploadedIpfsUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const { movePrice, formatMoveToUsd } = useMovePrice();

  const itemPrice = parseFloat(price) || 0;
  const platformFee = itemPrice * 0.05;
  const youllReceive = itemPrice - platformFee;
  
  // Calculate price per ticket from manual input
  const ticketCount = parseInt(ticketAmount) || 0;
  const pricePerTicket = ticketCount > 0 ? formatNumber(itemPrice / ticketCount) : "0";
  
  // USD conversions
  const listingPriceUsd = formatMoveToUsd(itemPrice);
  const youllReceiveUsd = formatMoveToUsd(youllReceive);
  
  // Calculate prize USD value based on selected token
  const getPrizeUsdValue = (): string => {
    const amount = parseFloat(prizeAmountInput) || 0;
    if (amount === 0) return '0.00';
    
    // For stablecoins, 1:1 with USD
    if (selectedPrizeToken.symbol === 'tUSDT' || selectedPrizeToken.symbol === 'tDAI') {
      return amount.toFixed(2);
    }
    // For MOVE, use Razor DEX price
    if (selectedPrizeToken.symbol === 'MOVE' && movePrice > 0) {
      return (amount * movePrice).toFixed(2);
    }
    return '...';
  };

  // Get asset display info
  const getAssetLogo = () => {
    if (!asset) return "💎";
    if (asset.type === 'token') {
      if (asset.isNative) {
        return <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-12 h-12 rounded-full" />;
      }
      return <span className="text-3xl">🪙</span>;
    }
    if (asset.image) {
      return <img src={asset.image} alt={asset.name} className="w-12 h-12 rounded-lg object-cover" />;
    }
    return "💎";
  };

  const getAssetName = () => {
    if (!asset) return "vpass badge # 12888";
    return asset.name;
  };

  const getAssetPrice = () => {
    if (!asset) return { label: "Floor", value: "0.45 ETH" };
    if (asset.type === 'token') {
      const balance = asset.balance ? parseFloat(asset.balance) : 0;
      if (asset.isNative && movePrice > 0) {
        const usdValue = (balance * movePrice).toFixed(2);
        return { label: "Balance", value: `~$${usdValue}` };
      }
      if (asset.symbol === 'tUSDT' || asset.symbol === 'tDAI' || asset.symbol === 'USDC') {
        return { label: "Balance", value: `~$${balance.toFixed(2)}` };
      }
      return { label: "Balance", value: `${formatNumber(balance)} ${asset.symbol}` };
    }
    return { label: "Floor", value: asset.floorPrice || "N/A" };
  };

  const assetLogo = getAssetLogo();
  const assetName = getAssetName();
  const assetPrice = getAssetPrice();

  // Image compression function
  const compressImage = useCallback(async (file: File, maxSizeMB: number = 5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let { width, height } = img;
        const maxDimension = 2048;
        
        // Scale down if too large
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.9 and reduce until under maxSizeMB
        let quality = 0.9;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                compress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        compress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Image upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    let processedFile = file;
    
    // Compress if larger than 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.info('Compressing image...');
      try {
        processedFile = await compressImage(file, 5);
        const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const compressedSizeMB = (processedFile.size / (1024 * 1024)).toFixed(2);
        toast.success(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
      } catch (error) {
        console.error('Failed to compress image:', error);
        toast.error('Failed to compress image. Please try a smaller file.');
        return;
      }
    }
    
    setUploadedFile(processedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(processedFile);

    if (isPinataConfiguredSync()) {
      setIsUploading(true);
      try {
        const ipfsUrl = await uploadToPinata(processedFile, `raffle-image-${Date.now()}`);
        setUploadedIpfsUrl(ipfsUrl);
      } catch (error: any) {
        console.error('Failed to upload to Pinata:', error);
        toast.error(error.message || 'Failed to upload image to IPFS');
      } finally {
        setIsUploading(false);
      }
    }
  }, [compressImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearUploadedImage = useCallback(() => {
    setUploadedFile(null);
    setPreviewUrl('');
    setUploadedIpfsUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleCreateRaffle = async () => {
    if (!user || !signRawHash) {
      toast.error('Please connect your wallet first');
      return;
    }

    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === 'aptos'
    ) as any;

    if (!moveWallet) {
      toast.error('Movement wallet not found');
      return;
    }

    const listingPrice = parseFloat(price);
    if (!listingPrice || listingPrice <= 0) {
      toast.error('Please enter a valid listing price');
      return;
    }

    const tickets = parseInt(ticketAmount);
    if (!tickets || tickets <= 0) {
      toast.error('Please enter valid ticket amount (minimum 1)');
      return;
    }

    // Check if non-MOVE token is selected - now supported with V3!
    const isNativeToken = selectedPrizeToken.symbol === 'MOVE';
    const isFAToken = selectedPrizeToken.symbol === 'tUSDT' || selectedPrizeToken.symbol === 'tDAI';

    try {
      setIsCreating(true);

      const days = parseInt(timeframe.split(' ')[0]) || 7;
      const ticketPrice = listingPrice / tickets;
      const targetAmount = listingPrice;
      const prizeAmount = parseFloat(prizeAmountInput) || 0;
      
      if (prizeAmount < 0) {
        toast.error('Prize amount cannot be negative');
        return;
      }

      let title = customTitle.trim();
      let description = customDescription.trim();
      
      const formatAmount = (amount: number): string => {
        return formatNumber(amount);
      };
      
      if (!title) {
        if (asset?.type === 'token') {
          const symbol = selectedPrizeToken.symbol;
          const prizeDisplay = formatAmount(prizeAmount > 0 ? prizeAmount : listingPrice);
          title = `${prizeDisplay} ${symbol} (${symbol})`;
        } else {
          const nftName = asset?.name || 'NFT';
          const idMatch = nftName.match(/#(\d+)/);
          if (idMatch) {
            const id = idMatch[1];
            const nameWithoutHash = nftName.replace(/#\d+/, '').trim();
            title = `${nameWithoutHash} #${id} (#${id})`;
          } else {
            title = `${nftName} NFT`;
          }
        }
      }
      
      if (!description) {
        if (asset?.type === 'token') {
          const prizeDisplay = formatAmount(prizeAmount > 0 ? prizeAmount : listingPrice);
          description = `Win ${prizeDisplay} ${selectedPrizeToken.symbol}! Buy tickets for a chance to win.`;
        } else {
          const listingDisplay = formatAmount(listingPrice);
          description = `Win this ${asset?.name || 'NFT'}! Total prize pool: ${listingDisplay} MOVE from ticket sales.`;
        }
      }

      let imageUrl = '';
      if (imageMode === 'upload' && uploadedIpfsUrl) {
        imageUrl = uploadedIpfsUrl;
      } else if (imageMode === 'upload' && previewUrl) {
        imageUrl = previewUrl;
      } else if (imageMode === 'url' && customImageUrl.trim()) {
        imageUrl = customImageUrl.trim();
      }
      
      if (!imageUrl) {
        if (asset?.image) {
          imageUrl = asset.image;
        } else if (asset?.type === 'token') {
          imageUrl = selectedPrizeToken.logo;
        } else {
          imageUrl = 'https://via.placeholder.com/400x400/1a1a2e/8b5cf6?text=NFT+Prize';
        }
      }

      toast.info('Creating raffle...');

      let result;
      
      if (isFAToken) {
        // Use V3 contract for FA tokens (tUSDT, tDAI)
        result = await createRaffleFA(
          title,
          description,
          imageUrl,
          ticketPrice,
          tickets,
          targetAmount,
          prizeAmount,
          days,
          selectedPrizeToken.address, // FA metadata address
          selectedPrizeToken.symbol,
          selectedPrizeToken.name,
          selectedPrizeToken.decimals,
          moveWallet.address,
          moveWallet.publicKey,
          signRawHash,
          undefined, // storeAddress - use default
          parseInt(maxTicketsPerUser) || 0 // V5: max tickets per user
        );
      } else if (isNativeToken) {
        // Use V3 contract for native MOVE
        result = await createRaffleNative(
          title,
          description,
          imageUrl,
          ticketPrice,
          tickets,
          targetAmount,
          prizeAmount,
          days,
          moveWallet.address,
          moveWallet.publicKey,
          signRawHash,
          undefined, // storeAddress - use default
          parseInt(maxTicketsPerUser) || 0 // V5: max tickets per user
        );
      } else {
        // Fallback to V2 for other cases
        result = await createRaffle(
          title, description, imageUrl, ticketPrice, tickets,
          targetAmount, prizeAmount, days,
          moveWallet.address, moveWallet.publicKey, signRawHash
        );
      }

      toast.success('Raffle created successfully!');
      
      await createNotification({
        user_address: moveWallet.address,
        type: 'raffle_created',
        title: 'Raffle Created! ✨',
        message: `Your raffle "${title}" has been created successfully. Good luck!`,
        amount: prizeAmount,
        transaction_hash: typeof result === 'string' ? result : undefined,
      });

      // Reset form
      setPrice("100");
      setTicketAmount("1000");
      setTimeframe("7 days");
      setAcknowledged(false);
      setCustomTitle("");
      setCustomDescription("");
      setCustomImageUrl("");
      setPrizeAmountInput("0");
      setMaxTicketsPerUser("0");
      setSelectedPrizeToken(SUPPORTED_TOKENS[0]);
      setImageMode('url');
      setUploadedFile(null);
      setPreviewUrl('');
      setUploadedIpfsUrl('');
      onOpenChange(false);

      await invalidateRaffleQueries();
      
      // Trigger global balance refresh
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 2000);

    } catch (error: any) {
      console.error('Error creating raffle:', error);
      const errorMessage = error.message || error.toString() || 'Failed to create raffle';
      
      if (errorMessage.toLowerCase().includes('insufficient') || 
          errorMessage.toLowerCase().includes('balance') ||
          errorMessage.includes('EINSUFFICIENT_BALANCE')) {
        toast.error('Insufficient Balance', {
          description: `You don't have enough ${selectedPrizeToken.symbol} to create this raffle.`,
        });
      } else if (errorMessage.toLowerCase().includes('rejected') || 
                 errorMessage.toLowerCase().includes('cancelled')) {
        toast.error('Transaction Cancelled');
      } else if (errorMessage.toLowerCase().includes('network')) {
        toast.error('Network Error', { description: 'Please check your connection.' });
      } else {
        toast.error('Failed to Create Raffle', {
          description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-md border-primary/20 max-w-md p-0 overflow-hidden shadow-2xl max-h-[90vh]">
        <DialogHeader className="p-4 pb-3 border-b border-white/5 bg-white/5 sticky top-0 z-10">
          <DialogTitle className="text-center font-mono tracking-wider text-lg font-bold">LIST YOUR ITEM</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Asset Preview */}
          <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg border border-white/5">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              {typeof assetLogo === 'string' ? <span className="text-2xl">{assetLogo}</span> : assetLogo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{assetName}</p>
              {asset?.symbol && <p className="text-xs text-muted-foreground mt-0.5">{asset.symbol}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{assetPrice.label}</p>
              <p className="font-mono text-sm font-medium text-primary">{assetPrice.value}</p>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-3 border-t border-white/5 pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customize Raffle (Optional)</p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Custom Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={asset?.name || "Enter custom title..."}
                className="w-full p-2.5 bg-input/50 rounded-lg border border-white/5 outline-none focus:border-primary/50 text-sm"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Custom Description</label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Enter custom description..."
                className="w-full p-2.5 bg-input/50 rounded-lg border border-white/5 outline-none focus:border-primary/50 text-sm resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Image Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Raffle Banner Image</label>
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                    imageMode === 'upload' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                    imageMode === 'url' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Link className="w-3 h-3" /> URL
                </button>
              </div>

              {imageMode === 'upload' && (
                <div className="space-y-2">
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-white/10" />
                      <button
                        type="button"
                        onClick={clearUploadedImage}
                        disabled={isUploading}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                      {isUploading && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/70 rounded text-xs">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            <span className="text-white">Uploading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer ${
                        isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/50'
                      }`}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <p className="text-xs font-medium">Drop image or click to upload</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                </div>
              )}

              {imageMode === 'url' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2.5 bg-input/50 rounded-lg border border-white/5 outline-none focus:border-primary/50 text-sm"
                  />
                  {customImageUrl && (
                    <img src={customImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-white/5 pt-3">
            {/* Listing Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Listing Price</label>
              <div className="flex items-center gap-2 p-2.5 bg-input/50 rounded-lg border border-white/5 focus-within:border-primary/50">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 rounded">
                  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/32452.png" alt="MOVE" className="w-3.5 h-3.5 rounded-full" />
                  <span className="text-xs font-bold text-primary">MOVE</span>
                </div>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-lg text-right font-bold"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-gray-500 text-right">~${listingPriceUsd}</p>
            </div>

            {/* Prize Amount with Token Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Prize Amount <span className="text-primary">*</span>
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-input/50 rounded-lg border border-white/5 focus-within:border-primary/50">
                {/* Token Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 rounded hover:bg-primary/30 transition-colors"
                  >
                    <img src={selectedPrizeToken.logo} alt={selectedPrizeToken.symbol} className="w-4 h-4 rounded-full" />
                    <span className="text-xs font-bold text-primary">{selectedPrizeToken.symbol}</span>
                    <ChevronDown className="w-3 h-3 text-primary" />
                  </button>
                  
                  {showTokenDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-card border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedPrizeToken(token);
                            setShowTokenDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors ${
                            selectedPrizeToken.symbol === token.symbol ? 'bg-primary/10' : ''
                          }`}
                        >
                          <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium">{token.symbol}</p>
                            <p className="text-[10px] text-muted-foreground">{token.name}</p>
                          </div>
                          {selectedPrizeToken.symbol === token.symbol && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  value={prizeAmountInput}
                  onChange={(e) => setPrizeAmountInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-lg text-right font-bold"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground">
                  {selectedPrizeToken.symbol !== 'MOVE' && (
                    <span className="text-green-500">✓ {selectedPrizeToken.symbol} supported via V3 contract</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500">~${getPrizeUsdValue()}</p>
              </div>
            </div>

            {/* Ticket Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Total Tickets</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none p-2.5 bg-secondary rounded-lg border border-white/5 outline-none focus:border-primary/50 font-mono text-sm"
                    value={ticketAmount}
                    onChange={(e) => setTicketAmount(e.target.value)}
                  >
                    <option value="100">100 tickets</option>
                    <option value="500">500 tickets</option>
                    <option value="1000">1,000 tickets</option>
                    <option value="5000">5,000 tickets</option>
                    <option value="10000">10,000 tickets</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ticket Price</label>
                <div className="p-2.5 bg-secondary rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">per ticket</span>
                  <span className="font-mono text-sm font-bold text-primary">{pricePerTicket} MOVE</span>
                </div>
              </div>
            </div>

            {/* Duration */}
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

            {/* Max Tickets Per User */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Tickets Per User</label>
              <div className="relative">
                <select
                  className="w-full appearance-none p-2.5 bg-secondary rounded-lg border border-white/5 outline-none focus:border-primary/50 font-mono text-xs"
                  value={maxTicketsPerUser}
                  onChange={(e) => setMaxTicketsPerUser(e.target.value)}
                >
                  <option value="0">Default (10% of total)</option>
                  <option value="1">1 ticket</option>
                  <option value="5">5 tickets</option>
                  <option value="10">10 tickets</option>
                  <option value="25">25 tickets</option>
                  <option value="50">50 tickets</option>
                  <option value="100">100 tickets</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[10px] text-muted-foreground">Limit how many tickets each wallet can buy</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-secondary/30 p-3 rounded-lg space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Listing Price</span>
              <div className="text-right">
                <span className="font-mono text-white">{formatNumber(itemPrice)} MOVE</span>
                <span className="text-[10px] text-gray-500 ml-1">~${listingPriceUsd}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Prize Deposit</span>
              <div className="text-right">
                <span className="font-mono text-primary">{formatNumber(parseFloat(prizeAmountInput || "0"))} {selectedPrizeToken.symbol}</span>
                <span className="text-[10px] text-gray-500 ml-1">~${getPrizeUsdValue()}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform Fee (5%)</span>
              <span className="font-mono text-red-400">-{formatNumber(platformFee)} MOVE</span>
            </div>
            <div className="flex justify-between text-sm pt-1.5 border-t border-white/5">
              <span className="font-medium">You Receive</span>
              <div className="text-right">
                <span className="font-mono font-bold text-primary">{formatNumber(youllReceive)} MOVE</span>
                <span className="text-[10px] text-gray-500 ml-1">~${youllReceiveUsd}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div 
                className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${
                  acknowledged ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary"
                }`}
                onClick={() => setAcknowledged(!acknowledged)}
              >
                {acknowledged && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed select-none" onClick={() => setAcknowledged(!acknowledged)}>
                I agree to the terms of service. Once listed, the asset is locked until the raffle ends or is cancelled.
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
                className="py-2.5 rounded-lg border border-white/10 hover:bg-white/5 font-mono tracking-wider text-xs disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateRaffle}
                disabled={!acknowledged || isCreating || isUploading}
                className="py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold font-mono tracking-wider disabled:opacity-50 shadow-lg shadow-primary/25 text-xs flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> CREATING...</>
                ) : (
                  'CREATE RAFFLE'
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal;
