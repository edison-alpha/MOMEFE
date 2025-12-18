import {
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';
import { aptos, toHex } from './aptos';

export interface SignRawHashFunction {
  (params: { address: string; chainType: 'aptos'; hash: `0x${string}` }): Promise<{
    signature: string;
  }>;
}

/**
 * Submit a transaction using Privy wallet
 */
export const submitTransaction = async (
  contractAddress: string,
  functionName: string,
  functionArguments: any[],
  walletAddress: string,
  publicKeyHex: string,
  signRawHash: SignRawHashFunction
): Promise<string> => {
  try {
    console.log('[Privy Transaction] Starting transaction:', { 
      contractAddress,
      functionName,
      walletAddress, 
      publicKeyLength: publicKeyHex?.length 
    });

    // Build the transaction
    const rawTxn = await aptos.transaction.build.simple({
      sender: walletAddress,
      data: {
        function: `${contractAddress}::${functionName}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments,
      },
    });

    console.log('[Privy Transaction] Transaction built successfully');

    // Generate signing message
    const message = generateSigningMessageForTransaction(rawTxn);
    console.log('[Privy Transaction] Signing message generated');

    // Sign with Privy wallet
    const { signature: rawSignature } = await signRawHash({
      address: walletAddress,
      chainType: 'aptos',
      hash: `0x${toHex(message)}`,
    });

    console.log('[Privy Transaction] Transaction signed successfully');

    // Create authenticator
    let cleanPublicKey = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex;

    // If public key is 66 characters (33 bytes), remove the first byte (00 prefix)
    if (cleanPublicKey.length === 66) {
      cleanPublicKey = cleanPublicKey.slice(2);
    }

    const senderAuthenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(cleanPublicKey),
      new Ed25519Signature(rawSignature.startsWith('0x') ? rawSignature.slice(2) : rawSignature)
    );

    console.log('[Privy Transaction] Submitting transaction to blockchain');

    // Submit the signed transaction
    const committedTransaction = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator,
    });

    console.log('[Privy Transaction] Transaction submitted:', committedTransaction.hash);

    // Wait for confirmation
    const executed = await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
    });

    if (!executed.success) {
      throw new Error('Transaction failed');
    }

    console.log('[Privy Transaction] Transaction confirmed successfully');

    return committedTransaction.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
};

/**
 * Submit transaction using native wallet adapter (for Nightly, etc.)
 */
export const submitTransactionNative = async (
  contractAddress: string,
  functionName: string,
  functionArguments: any[],
  walletAddress: string,
  signAndSubmitTransaction: any
): Promise<string> => {
  try {
    const response = await signAndSubmitTransaction({
      sender: walletAddress,
      data: {
        function: `${contractAddress}::${functionName}` as `${string}::${string}::${string}`,
        functionArguments,
      },
    });

    console.log(response);

    // Wait for transaction confirmation
    const executed = await aptos.waitForTransaction({
      transactionHash: response.hash,
    });

    if (!executed.success) {
      throw new Error('Transaction failed');
    }

    return response.hash;
  } catch (error) {
    console.error('Error submitting transaction with native wallet:', error);
    throw error;
  }
};
