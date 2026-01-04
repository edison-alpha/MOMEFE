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
  signRawHash: SignRawHashFunction,
  typeArguments: string[] = []
): Promise<string> => {
  try {
    // Build the transaction with extended expiration time
    const rawTxn = await aptos.transaction.build.simple({
      sender: walletAddress,
      data: {
        function: `${contractAddress}::${functionName}` as `${string}::${string}::${string}`,
        typeArguments,
        functionArguments,
      },
      options: {
        expireTimestamp: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
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
    let cleanPublicKey = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex;

    // If public key is 66 characters (33 bytes), remove the first byte (00 prefix)
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
      throw new Error('Transaction failed');
    }

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
