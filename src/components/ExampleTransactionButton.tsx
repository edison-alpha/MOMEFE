import { useMovementTransaction } from '@/hooks/useMovementTransaction';
import { Button } from '@/components/ui/button';

/**
 * Contoh komponen untuk melakukan transaksi ke Movement blockchain
 * 
 * Cara menggunakan:
 * 1. Ganti CONTRACT_ADDRESS dengan address smart contract Anda
 * 2. Ganti function name dan arguments sesuai dengan smart contract Anda
 */

const ExampleTransactionButton = () => {
  const { executeTransaction, isLoading } = useMovementTransaction();

  const handleTransaction = async () => {
    // Contoh: Memanggil fungsi smart contract
    const CONTRACT_ADDRESS = '0xYourContractAddress';
    const FUNCTION_NAME = 'module::function_name'; // format: module::function
    const ARGUMENTS = []; // array of arguments

    const txHash = await executeTransaction(
      CONTRACT_ADDRESS,
      FUNCTION_NAME,
      ARGUMENTS
    );

    if (txHash) {
      console.log('Transaction successful:', txHash);
      // Lakukan sesuatu setelah transaksi berhasil
    }
  };

  return (
    <Button 
      onClick={handleTransaction} 
      disabled={isLoading}
      className="bg-[#A04545] hover:bg-[#8a3b3b]"
    >
      {isLoading ? 'Processing...' : 'Execute Transaction'}
    </Button>
  );
};

export default ExampleTransactionButton;
