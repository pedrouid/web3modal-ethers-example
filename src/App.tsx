import React from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/ethereum-provider";
import { Contract, providers, utils } from "ethers";

// @ts-ignore
import logo from "./logo.svg";
import "./App.css";
import { formatAuthMessage } from "./utils";

interface Chain {
  chainId: string;
  chainName?: string;
  rpcUrls?: string[];
}
type Chains = Record<number, Chain>;

const ETHEREUM_RPC_URL = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`;
const POLYGON_RPC_URL = "https://polygon.llamarpc.com";

const USDC = {
  address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  abi: [
    "function transfer(address _to, uint256 _value) returns (bool success)",
  ],
};

const CHAINS: Chains = {
  1: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpcUrls: [ETHEREUM_RPC_URL],
  },
  137: {
    chainId: "0x89",
    chainName: "Polygon PoS",
    rpcUrls: [POLYGON_RPC_URL],
  },
};

function App() {
  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID,
        },
      },
    },
  });

  const [chainId, setChainId] = React.useState<number>(1);
  const [address, setAddress] = React.useState<string>("");
  const [provider, setProvider] = React.useState<providers.Web3Provider>();

  function accountsChanged(accounts: string[]) {
    console.log("accountsChanged", accounts);
    setAddress(accounts[0]);
  }

  function chainChanged(chainId: number) {
    console.log("chainChanged", chainId);
    setChainId(chainId);
  }

  function reset() {
    console.log("reset");
    setChainId(1);
    setAddress("");
    setProvider(undefined);
    web3Modal.clearCachedProvider();
  }

  async function connect() {
    if (!process.env.REACT_APP_INFURA_ID) {
      throw new Error("Missing Infura Id");
    }
    const web3Provider = await web3Modal.connect();
    
    web3Provider.on("accountsChanged", accountsChanged);
    web3Provider.on("chainChanged", chainChanged);
    web3Provider.on("disconnect", reset);

    const accounts = (await web3Provider.enable()) as string[];
    setAddress(accounts[0]);
    setChainId(web3Provider.chainId);

    web3Provider.on("accountsChanged", (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      setAddress(accounts[0]);
    });

    web3Provider.on("chainChanged", (chainId: any) => {
      console.log("chainChanged", chainId);
      setChainId(chainId);
    });

    web3Provider.on("disconnect", (error: any) => {
      console.log("disconnect", error);
      reset();
    });

    const provider = new providers.Web3Provider(web3Provider);
    setProvider(provider);
  }

  async function signMessage() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    const msg = formatAuthMessage(address, chainId);
    const sig = await provider.send("personal_sign", [msg, address]);
    console.log("Signature", sig);
    console.log("isValid", utils.verifyMessage(msg, sig) === utils.getAddress(address));
  }

  async function transferDai() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    const contract = new Contract(USDC.address, USDC.abi, provider.getSigner());
    const res = await contract.transfer(address, utils.parseEther("1"));
    console.log("res", res);
  }

  async function switchChain() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    const chain = CHAINS[chainId === 1 ? 137 : 1];
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: chain.chainId },
      ]);
    } catch (error) {
      console.log("error.code", (error as any).code);
      if ((error as any).code === 4902) {
        try {
          await provider.send("wallet_addEthereumChain", [chain]);
        } catch (error) {
          // ignore error
        }
      } else {
        // ignore error
      }
    }
  }

  async function disconnect() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    await (provider.provider as any).disconnect();
    reset();
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>{provider ? "Connected!" : "Not connected"}</div>
        {address ? (
          <>
            <div>{address}</div>
            <div>
              {!!CHAINS[chainId] ? CHAINS[chainId].chainName : "Unknown chain"}
            </div>
            <button onClick={signMessage}>{"Sign in with Ethereum"}</button>
            <button onClick={transferDai}>{"Transfer 1.0 USDC"}</button>
            <button onClick={switchChain}>
              {`Switch to ${chainId === 1 ? "Polygon" : "Ethereum"}`}
            </button>
            <button onClick={disconnect}>{"Disconnect Wallet"}</button>
          </>
        ) : (
          <button onClick={connect}>Connect Wallet</button>
        )}
      </header>
    </div>
  );
}

export default App;
