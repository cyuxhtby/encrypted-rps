import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInstance, provider, getTokenSignature} from "../utils/fhevm";
import { toHexString } from "../utils/utils";
import { Contract, ethers } from "ethers";
import rpsABI from "../abi/rpsABI";


const CONTRACT_ADDRESS = "0x5aC2d72604B20471926a9a26768C154Fd6bAe709";

function RockPaperScissorsGame() {
    const [instance, setInstance] = useState(null);
    const [contract, setContract] = useState(null);
    const [hasJoined, setHasJoined] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [playerAddress, setPlayerAddress] = useState("");
    const [choice, setChoice] = useState("");
    const [encryptedData, setEncryptedData] = useState("");


    useEffect(() => {
        async function fetchInstanceAndCheckPlayerStatus() {
            try {
                const instance = await getInstance();
                setInstance(instance);
                
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setPlayerAddress(address);
                
                const gameContract = new Contract(CONTRACT_ADDRESS, rpsABI, signer);
                setContract(gameContract);
            
                // Check if the current user has already joined the game
                const player1Data = await gameContract.player1();
                const player1Address = player1Data.playerAddress;
        
                const player2Data = await gameContract.player2();
                const player2Address = player2Data.playerAddress;
            
                if (address === player1Address || address === player2Address) {
                    setHasJoined(true);
                }
        
                console.log("Current User Address:", address);
                console.log("Player 1 Address:", player1Address);
                console.log("Player 2 Address:", player2Address);
        
            } catch (error) {
                console.error("Error fetching player data:", error);
            }
        }
        
        // This function sets up an event listener to detect account changes
        function handleAccountChange() {
            // Re-fetch player status when the account changes
            fetchInstanceAndCheckPlayerStatus();
        }
        
        // Set up the event listener
        provider.on("accountsChanged", handleAccountChange);
    
        // Fetch the player status on component mount
        fetchInstanceAndCheckPlayerStatus();
    
        // Clean up the event listener when the component is unmounted
        return () => {
            provider.off("accountsChanged", handleAccountChange);
        };
    }, [provider]);
    
     console.log("TESTING NETWORK")
     console.log(provider);
     provider.getNetwork().then(network => {
        console.log("Chain ID:", network.chainId);
        console.log("Network Name:", network.name);
    });
    provider.getCode(CONTRACT_ADDRESS).then(code => {
        if (code === "0x") {
            console.log("Contract not found at this address");
        } else {
            console.log("Contract found");
        }
    });
    provider.getBlockNumber().then(blockNumber => {
        console.log("Latest Block Number:", blockNumber);
    }); 
    if (rpsABI.some(item => item.name === "joinGame" && item.type === "function")) {
        console.log("joinGame function exists in ABI");
    } else {
        console.log("joinGame function not found in ABI");
    }
            
    console.log(" NETWORK TESTED")



    const joinGame = async () => {
        try {
            setMessage("Joining game...")
            const transaction = await contract.joinGame();
            setMessage("Waiting for transaction validation...");
            await provider.waitForTransaction(transaction.hash);
            setMessage("Choose your move!")
            setHasJoined(true);
        } catch (error) {
            console.log(error);
            if (error.data && error.data.message) {
                setMessage(error.data.message);
            } else {
                setMessage("Transaction error!");
            }
        }
    };

    const play = async () => {
        if (!choice) {
            setMessage("Please select a choice first.");
            return;
        }
        let encrypted;
        try {
            setMessage("Processing your move...");
            
            const instance = await getInstance();
            encrypted = toHexString(instance.encrypt8(Number(choice))); // Assuming choice is a uint8
            
            const tx = await contract.play("0x" + encrypted, { gasLimit: 300000 });
            
            setMessage("Waiting for transaction validation...");
            await provider.waitForTransaction(tx.hash);
            
            setMessage("Move successfully submitted!");
    
        } catch (error) {
            console.log("Encrypted choice:", encrypted);
            console.error("Play error: ", error);
            
            if (error.data && error.data.message) {
                setMessage(error.data.message);
            } else {
                setMessage("Error submitting move.");
            }
        }
    };
    

    const revealWinner = async () => {
        const addressZero = "0x0000000000000000000000000000000000000000";
        try {
            setMessage("Revealing Winner...");
            const tx = await contract.revealWinner({ gasLimit: 300000 });
            await provider.waitForTransaction(tx.hash);  // Wait for the transaction to be mined
            const gameWinner = await contract.winner();
            if (gameWinner === addressZero) {
                setMessage("It's a draw!");
            } else {
                setMessage(`The winner is ${gameWinner}`);
            }
        } catch (error) {
            console.error("Error revealing the winner:", error);
            setMessage("Error revealing the winner.");
        }
    };
    
    
    console.log("has joined "+hasJoined);
    
    return (
        <div>
            <Link to="/">Back to Main Page</Link>
            <h1>Rock Paper Scissors Game</h1>
            {playerAddress && hasJoined &&(
                <div>
                    <select onChange={(e) => setChoice(e.target.value)}>
                        <option value="">Select your choice</option>
                        <option value="0">Rock</option>
                        <option value="1">Paper</option>
                        <option value="2">Scissors</option>
                    </select>
                    <button onClick={play}>Play</button>
                    <button onClick={revealWinner}>Reveal Winner</button>
                </div>
            )}
            {!hasJoined && (
                <div>
                    <button onClick={joinGame}>Join Game</button>
                </div>
            )}

            {loading && <p>Loading...</p>}
            {message && <p>{message}</p>}
        </div>
    );
}

export default RockPaperScissorsGame;
