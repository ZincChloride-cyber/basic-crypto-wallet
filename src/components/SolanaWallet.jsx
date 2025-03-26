import { useState } from 'react';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import nacl from 'tweetnacl';

const SOLANA_RPC = new Connection('https://api.mainnet-beta.solana.com');

export default function SolanaWallet({ navigate }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  const addWallet = async () => {
    try {
      setLoading(true);
      const index = wallets.length;
      setWallets([...wallets, { index }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Solana Wallets</h2>
        <button
          onClick={addWallet}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          {loading ? 'Adding...' : 'Add Wallet'}
        </button>
      </div>

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <div 
            key={wallet.index}
            onClick={() => navigate(`/wallet/solana/${wallet.index}`)}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
          >
            <h3 className="font-medium">Wallet #{wallet.index}</h3>
            <p className="text-sm text-gray-400">Click to view details</p>
          </div>
        ))}
      </div>
    </div>
  );
}