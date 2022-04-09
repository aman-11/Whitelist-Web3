import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import coverImage from "../public/crypto-devs.svg";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { abi, WHITELIST_CONTRACT_ADDRESS } from "../constants/ContractVariable";
import { CheckCircleIcon } from "@heroicons/react/solid";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [numOfWhitelisted, setNumOfWhitelisted] = useState(0);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);

  const web3ModalRef = useRef();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProvisersAndSigners = async (needSigner = false) => {
    try {
      const instance = await web3ModalRef.current.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);

      // if the user is not connected to rinkebyb let them know
      // const chainId = await instance.request({ method: "eth_chainId" }); //ox4
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 4) {
        // console.log(chainId);
        alert("Please connect to Rinkeby Network");
        throw new Error("Please connect to Rinkeby Network");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      //else return Provider
      return web3Provider;
    } catch (error) {
      console.error(error);
    }
  };

  const addAddressToWhitelist = async () => {
    try {
      setLoading(true);
      //get the signers
      const signer = await getProvisersAndSigners(true);
      const whitelistContract = new ethers.Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      const tx = await whitelistContract.addWhitelistAddress();
      // wait for the transaction to get mined
      await tx.wait();

      //else call the getthenumofwhitelist
      setNumOfWhitelisted(numOfWhitelisted + 1);
      setJoinedWhitelist(true);
      setLoading(false);
    } catch (error) {
      setloading(false);
      console.error(error);
    }
  };

  const getTheNumOFWhitelisted = async () => {
    try {
      //since this is the method to get the no of whitelist --> use Provider
      const provider = await getProvisersAndSigners();
      const whitelistContract = new ethers.Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const totalWhitelisted = await whitelistContract.numWhitelistedAddress();
      console.log("total", totalWhitelisted);
      setNumOfWhitelisted(totalWhitelisted);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfAddressisWhitelisted = async () => {
    //get the signers
    const signer = await getProvisersAndSigners(true);
    const whitelistContract = new ethers.Contract(
      WHITELIST_CONTRACT_ADDRESS,
      abi,
      signer
    );

    // Get the address associated to the signer which is connected to  MetaMask
    const address = await signer.getAddress();
    const joinedWhitelist = await whitelistContract.whitelistedAddress(address);
    // console.log("joined?", joinedWhitelist);
    setJoinedWhitelist(joinedWhitelist);
  };

  const connectWallet = async () => {
    try {
      await getProvisersAndSigners(); //*Done
      setWalletConnected(true);

      checkIfAddressisWhitelisted();
      getTheNumOFWhitelisted(); //*Done
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum === "undefined") {
      console.log("MetaMask is not installed!");
    }

    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby", // optional
        providerOptions: {}, // required
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className="flex items-center space-x-2 mt-6">
            <CheckCircleIcon className="text-green-500 h-8" />
            <h1 className="text-lg font-semibold">
              Thanks for joining the Whitelist!
            </h1>
          </div>
        );
      } else {
        return (
          <button
            onClick={addAddressToWhitelist}
            disabled={loading}
            className="text-gray-900 bg-white border border-gray-300  mt-8 text-sm focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
          >
            {loading ? "Processing..." : "Join the Whitelist"}
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className="border-md p-4">
          Connect your wallet
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta property="og:title" content="Whitelist" key="title" />
      </Head>

      <main className="min-h-[90vh] flex items-center justify-center">
        <div className="mr-32">
          <h2 className="font-mono  font-semibold text-5xl flex-grow">
            Welcome to Crypto Devs!
          </h2>
          <p className="font-mono text-xl font-medium text-gray-600 mt-4">
            {" "}
            Its an NFT collection for developers in Crypto.
          </p>
          <p className="font-mono text-xl font-medium text-gray-600 mt-4">
            {" "}
            {numOfWhitelisted} have already joined the Whitelist
          </p>
          {renderButton()}
        </div>

        <Image src={coverImage} width={600} height={400} alt="Dev" />
      </main>

      <footer className="flex justify-center mt-6 text-gray-500">
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
