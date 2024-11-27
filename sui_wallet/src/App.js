import React, { useState, useEffect } from "react";
import {
  createNetworkConfig,
  SuiClientProvider,
  useSuiClient,
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  WalletProvider,
} from "@mysten/dapp-kit";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { FaCopy } from "react-icons/fa"; // Import copy icon

// Network configurations
const { networkConfig } = createNetworkConfig({
  testnet: {
    url: "https://fullnode.testnet.sui.io/",
  },
  mainnet: {
    url: "https://fullnode.mainnet.sui.io/",
  },
});

const queryClient = new QueryClient();
const SUI_TYPE = "0x2::sui::SUI";

function HomeContent() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [availableCoins, setAvailableCoins] = useState(0);
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => {
    if (currentAccount) {
      setConnected(true);
      fetchAvailableCoins();
    } else {
      setConnected(false);
      setAvailableCoins(0);
    }
  }, [currentAccount]);

  const fetchAvailableCoins = async () => {
    try {
      const { data: coins } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: SUI_TYPE,
      });
      const totalBalance = coins.reduce(
        (acc, coin) => acc + parseFloat(coin.balance),
        0
      );
      setAvailableCoins(totalBalance / 1_000_000_000); // Convert to SUI units
    } catch (error) {
      console.error("Error fetching coins:", error);
    }
  };

  const handleSendTokens = async () => {
    if (!currentAccount || !amount || !recipientAddress) {
      setTxStatus("Please connect wallet and fill in all fields");
      return;
    }

    try {
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      const amountInSmallestUnit = parseFloat(amount) * 1_000_000_000;
      const coin = coinWithBalance({ balance: amountInSmallestUnit.toString() });
      tx.transferObjects([coin], recipientAddress);

      await signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            const digestLink = `https://suiscan.xyz/testnet/tx/${result.digest}`;
            setTxStatus(
              `Click the below link to view the transaction it on SuiScan: 
              <a href="${digestLink}" target="_blank" rel="noopener noreferrer">${result.digest}</a>`
            );
            alert("Transaction Completed Successfully!");
          },
          onError: (error) => {
            setTxStatus(`Error: ${error.message || "Transaction failed"}`);
            alert("Transaction Failed. Please try again.");
          },
        }
      );
    } catch (error) {
      setTxStatus(`Error: ${error.message || "Unknown error occurred"}`);
      alert("Error occurred. Please try again.");
    }
  };

  const handleCopyAddress = () => {
    if (currentAccount) {
      navigator.clipboard.writeText(currentAccount.address);
      alert("Address copied to clipboard!");
    }
  };

  const shortenAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <main className="mainwrapper">
      <div className="outerwrapper">
        <div className="card">
          <h1 className="h1">Sui Wallet</h1>
          <div className="inner-card">
            <div className="connect-box">
              <ConnectButton />
              {connected && currentAccount && (
                <div className="status">
                  Connected: {shortenAddress(currentAccount.address)}
                  <FaCopy
                    onClick={handleCopyAddress}
                    className="copy-icon"
                    style={{ cursor: "pointer", marginLeft: "8px" }}
                    title="Copy Address"
                  />
                </div>
              )}
            </div>
            {connected && (
              <p style={{ fontWeight: "bold", color: "#4da1ff" }}>
                Available SUI: {availableCoins.toFixed(4)}
              </p>
            )}
            <input
              type="text"
              placeholder="Amount (in SUI)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input curved-input"
            />
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="input curved-input"
            />
            <button
              onClick={handleSendTokens}
              disabled={!connected}
              className={`send-button ${
                connected && amount && recipientAddress ? "enabled" : "disabled"
              }`}
            >
              Send SUI
            </button>
            {txStatus && (
              <p
                className="status"
                dangerouslySetInnerHTML={{ __html: txStatus }}
              ></p>
            )}
            
          </div>
        </div>
        
      </div>
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          <HomeContent />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
