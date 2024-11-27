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
import { Transaction, coinWithBalance } from "@mysten/sui/transactions"; // Import coinWithBalance from @mysten/sui/transactions
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

// Updated network configurations
const { networkConfig } = createNetworkConfig({
  testnet: {
    url: "https://fullnode.testnet.sui.io/",
  },
  mainnet: {
    url: "https://fullnode.mainnet.sui.io/",
  },
});

const queryClient = new QueryClient();

// Native SUI coin type
const SUI_TYPE = "0x2::sui::SUI";

function HomeContent() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => {
    setConnected(!!currentAccount);
    console.log("Current Account:", currentAccount); // Debugging log
  }, [currentAccount]);

  const handleSendTokens = async () => {
    if (!currentAccount || !amount || !recipientAddress) {
      setTxStatus("Please connect wallet and fill in all fields");
      return;
    }

    try {
      // Fetch SUI coins owned by the current account
      const { data: coins } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: SUI_TYPE,
      });

      console.log("Coins in wallet:", coins); // Debugging log

      if (!coins || coins.length === 0) {
        setTxStatus("No SUI coins found in your wallet");
        return;
      }

      // Create the transaction
      const tx = new Transaction();

      // Set the sender's address for the transaction
      tx.setSender(currentAccount.address);

      // Convert amount to the smallest unit (MIST)
      const amountInSmallestUnit = BigInt(parseFloat(amount) * 1_000_000_000);

      console.log("Amount in smallest unit:", amountInSmallestUnit.toString()); // Debugging log

      // Create a coin with the required balance
      const coin = coinWithBalance({ balance: amountInSmallestUnit.toString() });
      console.log("Coin to transfer:", coin); // Debugging log

      // Transfer the coin to the recipient address
      tx.transferObjects([coin], recipientAddress);

      // Log transaction data
      console.log("Transaction object:", tx);

      // Sign and execute the transaction
      await signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction result:", result);
            setTxStatus(`Transaction successful. Digest: ${result.digest}`);
          },
          onError: (error) => {
            console.error("Error during transaction execution:", error);
            setTxStatus(`Error: ${error.message || "Transaction failed"}`);
          },
        }
      );
    } catch (error) {
      console.error("Error sending tokens:", error);

      // Enhanced error handling for node or network issues
      if (error.response) {
        setTxStatus(`HTTP Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.message.includes("502")) {
        setTxStatus("SUI Testnet node is unavailable. Please try again later.");
      } else {
        setTxStatus(`Error: ${error.message || "Unknown error occurred"}`);
      }
    }
  };

  return (
    <main className="mainwrapper">
      <div className="outerwrapper">
        <h1 className="h1">Sui Sender (Testnet)</h1>
        <ConnectButton />
        {connected && currentAccount && (
          <p className="status">Connected: {currentAccount.address}</p>
        )}
        <div className="form">
          <input
            type="text"
            placeholder="Amount (in SUI)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="input"
          />
          <button
            onClick={handleSendTokens}
            disabled={!connected}
            className={`${
              connected && amount && recipientAddress
                ? "connected"
                : "notconnected"
            } transition`}
          >
            Send SUI
          </button>
        </div>
        {txStatus && <p className="status">{txStatus || "Awaiting transaction..."}</p>}
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
