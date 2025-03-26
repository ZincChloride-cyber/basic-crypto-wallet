import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

export default function EthWallet({ navigate, mnemonic }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('ethWallets');
    if (savedWallets) {
      setWallets(JSON.parse(savedWallets));
    }
  }, []);

  // Save wallets to localStorage
  useEffect(() => {
    localStorage.setItem('ethWallets', JSON.stringify(wallets));
  }, [wallets]);

  const generateEthAddress = (index) => {
    if (!mnemonic) {
      throw new Error('No recovery phrase available');
    }
    
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    return {
      index,
      address: wallet.address,
      privateKey: wallet.privateKey,
      balance: 0
    };
  };

  const addWallet = async () => {
    try {
      setLoading(true);
      const index = wallets.length;
      const newWallet = generateEthAddress(index);
      
      // Get balance (optional)
      try {
        const provider = ethers.getDefaultProvider();
        const balance = await provider.getBalance(newWallet.address);
        newWallet.balance = ethers.utils.formatEther(balance);
      } catch (e) {
        console.warn("Couldn't fetch balance", e);
        newWallet.balance = "0";
      }
      
      setWallets([...wallets, newWallet]);
      toast.success(`Wallet ${index + 1} created successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to create wallet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ethereum Wallets</h2>
        <button
          onClick={addWallet}
          disabled={loading || !mnemonic}
          className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Add Wallet'}
        </button>
      </div>

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <div 
            key={wallet.index}
            onClick={() => navigate(`/wallet/ethereum/${wallet.index}`)}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
          >
            <h3 className="font-medium">Wallet #{wallet.index + 1}</h3>
            <p className="text-sm text-gray-400 truncate">
              {wallet.address}
            </p>
            <p className="text-sm mt-1">{wallet.balance} ETH</p>
          </div>
        ))}
      </div>
    </div>
  );
}