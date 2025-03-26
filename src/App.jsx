import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { HDNodeWallet, ethers } from 'ethers';
import { derivePath } from 'ed25519-hd-key';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WalletDetails from './WalletDetails';

function App() {
  const [mnemonic, setMnemonic] = useState(() => {
    return localStorage.getItem('walletMnemonic') || '';
  });
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  // Set dark mode by default and persist mnemonic
  useEffect(() => {
    document.documentElement.classList.add('dark');
    if (mnemonic) {
      localStorage.setItem('walletMnemonic', mnemonic);
    }
  }, [mnemonic]);

  const createNewWallet = () => {
    try {
      const newMnemonic = generateMnemonic(256);
      if (!validateMnemonic(newMnemonic)) throw new Error('Invalid mnemonic');
      
      setMnemonic(newMnemonic);
      toast.success('Wallet created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to create wallet: ' + error.message);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Home Page Component
  const HomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-6">Secure Crypto Wallet</h1>
        <button
          onClick={createNewWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
        >
          Create New Wallet
        </button>
        <p className="mt-6 text-gray-400">
          Generate a secure 24-word recovery phrase
        </p>
      </div>
    </div>
  );

  // Dashboard Component
  const Dashboard = () => {
    const SolanaWallets = () => {
      const [wallets, setWallets] = useState(() => {
        const saved = localStorage.getItem('solanaWallets');
        return saved ? JSON.parse(saved) : [];
      });
    
      useEffect(() => {
        localStorage.setItem('solanaWallets', JSON.stringify(wallets));
      }, [wallets]);
    
      const addWallet = async () => {
        try {
          if (!validateMnemonic(mnemonic)) {
            throw new Error('Invalid recovery phrase');
          }

          const seed = mnemonicToSeedSync(mnemonic);
          const path = `m/44'/501'/${wallets.length}'/0'`;
          const derived = derivePath(path, seed.toString('hex'));
          const keypair = Keypair.fromSeed(derived.key.slice(0, 32));
          
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          let balance;
          try {
            balance = await connection.getBalance(keypair.publicKey);
          } catch (e) {
            console.warn("Balance check failed, using 0 as default");
            balance = 0;
          }

          const newWallet = {
            index: wallets.length,
            publicKey: keypair.publicKey.toBase58(),
            balance: balance / LAMPORTS_PER_SOL
          };

          setWallets([...wallets, newWallet]);
          toast.success(`Solana wallet ${wallets.length + 1} created successfully`);
        } catch (error) {
          console.error('Wallet creation error:', error);
          toast.error(`Failed to create wallet: ${error.message}`);
        }
      };
    
      return (
        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Solana Wallets</h2>
            <button
              onClick={addWallet}
              disabled={!mnemonic}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ${
                !mnemonic ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Add Wallet
            </button>
          </div>
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.index}
                onClick={() => navigate(`/wallet/solana/${wallet.index}`)}
                className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
              >
                <h3 className="font-medium">Wallet #{wallet.index + 1}</h3>
                <p className="text-sm text-gray-400 truncate">{wallet.publicKey}</p>
                <p className="text-sm mt-1">{wallet.balance} SOL</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const EthereumWallets = () => {
      const [wallets, setWallets] = useState(() => {
        const saved = localStorage.getItem('ethereumWallets');
        return saved ? JSON.parse(saved) : [];
      });

      useEffect(() => {
        localStorage.setItem('ethereumWallets', JSON.stringify(wallets));
      }, [wallets]);

      const addWallet = async () => {
        try {
          if (!validateMnemonic(mnemonic)) {
            throw new Error('Invalid recovery phrase');
          }

          const seed = mnemonicToSeedSync(mnemonic);
          const path = `m/44'/60'/${wallets.length}'/0/0`;
          const hdNode = HDNodeWallet.fromSeed(seed);
          const wallet = hdNode.derivePath(path);
          
          let balance = "0";
          try {
            const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
            balance = ethers.formatEther(await provider.getBalance(wallet.address));
          } catch (e) {
            console.warn("Balance check failed, using 0 as default");
          }

          const newWallet = {
            index: wallets.length,
            address: wallet.address,
            balance: balance,
            privateKey: wallet.privateKey
          };

          setWallets([...wallets, newWallet]);
          toast.success(`Ethereum wallet ${wallets.length + 1} created successfully`);
        } catch (error) {
          console.error('Wallet creation error:', error);
          toast.error(`Failed to create wallet: ${error.message}`);
        }
      };

      return (
        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ethereum Wallets</h2>
            <button
              onClick={addWallet}
              disabled={!mnemonic}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ${
                !mnemonic ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Add Wallet
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
                <p className="text-sm text-gray-400 truncate">{wallet.address}</p>
                <p className="text-sm mt-1">{wallet.balance} ETH</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>
        <div className="bg-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Recovery Phrase</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {mnemonic.split(' ').map((word, index) => (
              <div 
                key={index} 
                className="flex items-center bg-gray-700 p-2 rounded"
              >
                <span className="text-gray-400 mr-2 text-sm">{index + 1}.</span>
                <span>{word}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-800">
            <p className="text-sm text-yellow-300">
              ⚠️ Write this down and store it securely. Never share it with anyone!
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SolanaWallets />
          <EthereumWallets />
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet/:chain/:index" element={<WalletDetails />} />
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        theme={darkMode ? 'dark' : 'light'}
        toastStyle={{ backgroundColor: darkMode ? '#1F2937' : '#F3F4F6' }}
      />
    </div>
  );
}

export default App;