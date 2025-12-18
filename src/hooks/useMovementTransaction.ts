import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { submitTransaction } from '@/lib/transactions';
import { toast } from 'sonner';
import { getExplorerUrl } from '@/lib/aptos';

export const useMovementTransaction = () => {
  const { authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [isLoading, setIsLoading] = useState(false);

  const executeTransaction = async (
    contractAddress: string,
    functionName: string,
    functionArguments: any[]
  ): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      if (!authenticated || !user) {
        throw new Error('Please connect your wallet first');
      }

      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (!moveWallet) {
        throw new Error('No Movement wallet found. Please try logging in again.');
      }

      const walletAddress = moveWallet.address;
      const publicKey = moveWallet.publicKey;

      if (!signRawHash) {
        throw new Error('Signing function not available');
      }

      const txHash = await submitTransaction(
        contractAddress,
        functionName,
        functionArguments,
        walletAddress,
        publicKey,
        signRawHash
      );

      toast.success('Transaction successful!', {
        description: 'View on explorer',
        action: {
          label: 'View',
          onClick: () => window.open(getExplorerUrl(txHash), '_blank'),
        },
      });

      return txHash;
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed', {
        description: error.message || 'Please try again',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeTransaction,
    isLoading,
  };
};
