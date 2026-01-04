import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import {
  TokenInfo,
  SUPPORTED_TOKENS,
  getSwapQuote,
  buildSwapTransaction,
  checkPairExists,
} from '@/lib/razor-swap';
import { Trade, TradeType } from '@razorlabs/amm-sdk';
import {
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';
import { aptos, toHex } from '@/lib/aptos';

export interface SwapQuote {
  outputAmount: string;
  priceImpact: string;
  executionPrice: string;
  minimumReceived: string;
  route: string[];
  autoSlippage: number; // Auto-calculated optimal slippage
}

export function useRazorSwap() {
  const { authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [isSwapping, setIsSwapping] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [currentTrade, setCurrentTrade] = useState<Trade<any, any, TradeType> | null>(null);

  /**
   * Get list of supported tokens
   */
  const getSupportedTokens = useCallback((): TokenInfo[] => {
    return SUPPORTED_TOKENS;
  }, []);

  /**
   * Get swap quote
   */
  const getQuote = useCallback(async (
    inputToken: TokenInfo,
    outputToken: TokenInfo,
    inputAmount: string
  ): Promise<SwapQuote | null> => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      setCurrentTrade(null);
      return null;
    }

    setIsLoadingQuote(true);

    try {
      const result = await getSwapQuote(inputToken, outputToken, inputAmount);
      
      if (!result) {
        setQuote(null);
        setCurrentTrade(null);
        return null;
      }

      const quoteData: SwapQuote = {
        outputAmount: result.outputAmount,
        priceImpact: result.priceImpact,
        executionPrice: result.executionPrice,
        minimumReceived: result.minimumReceived,
        route: result.route,
        autoSlippage: result.autoSlippage,
      };

      setQuote(quoteData);
      setCurrentTrade(result.trade);
      return quoteData;
    } catch (error) {
      console.error('Error getting quote:', error);
      setQuote(null);
      setCurrentTrade(null);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  /**
   * Execute swap transaction
   * Uses auto slippage from quote if no manual slippage provided
   */
  const executeSwap = useCallback(async (
    inputToken: TokenInfo,
    outputToken: TokenInfo,
    _inputAmount: string, // kept for API compatibility
    manualSlippage?: number // Optional manual override
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!authenticated || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!signRawHash) {
      return { success: false, error: 'Signing function not available' };
    }

    if (!currentTrade || !quote) {
      return { success: false, error: 'No trade quote available. Please get a quote first.' };
    }

    // Use manual slippage if provided, otherwise use auto slippage from quote
    const slippage = manualSlippage ?? quote.autoSlippage;

    setIsSwapping(true);

    try {
      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === 'aptos'
      ) as any;

      if (!moveWallet) {
        throw new Error('No Movement wallet found');
      }

      const walletAddress = moveWallet.address;
      const publicKey = moveWallet.publicKey;

      // Check if input or output is native MOVE
      const isInputNative = inputToken.address === 'native';
      const isOutputNative = outputToken.address === 'native';

      // Build swap transaction using SDK Router with auto/manual slippage
      const txParams = buildSwapTransaction(
        currentTrade, 
        walletAddress, 
        slippage,
        20, // deadline minutes
        isInputNative,
        isOutputNative
      );
      
      if (!txParams) {
        throw new Error('Failed to build swap transaction');
      }

      // Extract module and function from functionId
      const parts = txParams.functionId.split('::');
      const moduleAddress = parts[0];
      const functionPath = parts.slice(1).join('::');

      // Build the transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: walletAddress,
        data: {
          function: `${moduleAddress}::${functionPath}` as `${string}::${string}::${string}`,
          typeArguments: txParams.typeArgs,
          functionArguments: txParams.args,
        },
        options: {
          expireTimestamp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        },
      });

      // Generate signing message
      const message = generateSigningMessageForTransaction(rawTxn);

      // Sign with Privy wallet
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: 'aptos',
        hash: `0x${toHex(message)}`,
      });

      // Create authenticator
      let cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
      if (cleanPublicKey.length === 66) {
        cleanPublicKey = cleanPublicKey.slice(2);
      }

      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(cleanPublicKey),
        new Ed25519Signature(rawSignature.startsWith('0x') ? rawSignature.slice(2) : rawSignature)
      );

      // Submit the signed transaction
      const committedTransaction = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      // Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      if (!executed.success) {
        throw new Error('Transaction failed on chain');
      }

      return { success: true, txHash: committedTransaction.hash };
    } catch (error: any) {
      console.error('Swap error:', error);
      return {
        success: false,
        error: error.message || 'Swap failed',
      };
    } finally {
      setIsSwapping(false);
    }
  }, [authenticated, user, signRawHash, currentTrade, quote]);

  /**
   * Check if pool exists for token pair
   */
  const checkPool = useCallback(async (
    inputToken: TokenInfo,
    outputToken: TokenInfo
  ): Promise<boolean> => {
    return checkPairExists(inputToken, outputToken);
  }, []);

  return {
    getSupportedTokens,
    getQuote,
    executeSwap,
    checkPool,
    isSwapping,
    isLoadingQuote,
    quote,
  };
}
