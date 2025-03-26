import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { HDNodeWallet, ethers } from 'ethers';
import { toast } from 'react-toastify';

export default function WalletDetails() {
  const { chain, index } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);

  // Get mnemonic from localStorage
  const mnemonic = localStorage.getItem('walletMnemonic') || '';

  useEffect(() => {
    if (!validateMnemonic(mnemonic)) {
      navigate('/');
      return;
    }

    const loadWallet = async () => {
      try {
        const seed = mnemonicToSeedSync(mnemonic);
        
        if (chain === 'solana') {
          const path = `m/44'/501'/${index}'/0'`;
          const derived = derivePath(path, seed.toString('hex'));
          const keypair = Keypair.fromSeed(derived.key.slice(0, 32));
          
          try {
            const connection = new Connection('https://api.mainnet-beta.solana.com');
            const bal = await connection.getBalance(keypair.publicKey);
            setBalance((bal / LAMPORTS_PER_SOL).toFixed(4));
          } catch (e) {
            console.warn("Failed to fetch SOL balance");
          }
          
          setWallet({
            publicKey: keypair.publicKey.toBase58(),
            privateKey: Buffer.from(keypair.secretKey).toString('hex'),
            type: 'Solana'
          });
        } else {
          const path = `m/44'/60'/${index}'/0/0`;
          const hdNode = HDNodeWallet.fromSeed(seed);
          const wallet = hdNode.derivePath(path);
          
          try {
            const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
            const bal = await provider.getBalance(wallet.address);
            setBalance(ethers.formatEther(bal));
          } catch (e) {
            console.warn("Failed to fetch ETH balance");
          }
          
          setWallet({
            publicKey: wallet.address,
            privateKey: wallet.privateKey,
            type: 'Ethereum'
          });
        }
      } catch (error) {
        console.error(error);
        toast.error(`Failed to load ${chain} wallet`);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [mnemonic, chain, index, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading wallet details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-900 text-gray-100">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-blue-400 hover:text-blue-300 flex items-center"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Wallet #{Number(index) + 1}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              wallet?.type === 'Solana' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'
            }`}>
              {wallet?.type}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Public Address</h2>
            <p className="bg-gray-700 p-3 rounded-lg break-all font-mono">
              {wallet?.publicKey}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Private Key</h2>
            <p className="bg-gray-700 p-3 rounded-lg break-all font-mono">
              {wallet?.privateKey}
            </p>
            <p className="text-red-400 text-sm mt-2">
              ⚠️ Never share your private key with anyone!
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Balance</h2>
            <p className="text-2xl font-bold">
              {balance} {wallet?.type === 'Solana' ? 'SOL' : 'ETH'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}