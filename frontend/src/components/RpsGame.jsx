import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInstance, provider } from "../utils/fhevm";
import { Contract } from "ethers";
import rpsABI from "../abi/rpsABI";

const CONTRACT_ADDRESS = "0xf3DFC5Bf5B20D546ab36AB315204C75b55EaFf33";

function RockPaperScissorsGame() {
    const [playerAddress, setPlayerAddress] = useState("");
    const [choice, setChoice] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [instance, setInstance] = useState(null);
    const [contract, setContract] = useState(null);
   

    useEffect(() => {
        async function fetchInstance() {
            const instance = await getInstance();
            setInstance(instance);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setPlayerAddress(address);
            const gameContract = new Contract(CONTRACT_ADDRESS, rpsABI, signer);
            setContract(gameContract);
        }
        fetchInstance();
     }, []);
     
    


    const joinGame = async () => {
        setLoading(true);
        try {
            await contract.joinGame();
            setMessage("You've joined the game!");
        } catch (error) {
            console.error("Error while trying to join the game:", error);
            setMessage("Error joining the game.");
        }
        setLoading(false);
    };

    const play = async () => {
        if (!choice || !instance) {
            setMessage("Please select a choice first.");
            return;
        }

        setLoading(true);
        try {
            const encrypted = instance.encrypt8(choice);
            await contract.play(encrypted);
            setMessage("Choice submitted!");
        } catch (error) {
            console.log("Encrypted choice:", encrypted);
            console.error("Play error: ", error);
            setMessage("Error submitting choice.");
        }
        setLoading(false);
    };

    const revealWinner = async () => {
        setLoading(true);
        try {
            await contract.revealWinner();
            const gameWinner = await contract.winner();
            if (gameWinner === ethers.constants.AddressZero) {
                setMessage("It's a draw!");
            } else {
                setMessage(`The winner is ${gameWinner}`);
            }
        } catch (error) {
            setMessage("Error revealing the winner.");
        }
        setLoading(false);
    };

    return (
        <div>
            <Link to="/">Back to Main Page</Link>
            <h1>Rock Paper Scissors Game</h1>
            
            {!playerAddress && (
                <button onClick={joinGame}>Join Game</button>
            )}

            {playerAddress && (
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

            {loading && <p>Loading...</p>}
            {message && <p>{message}</p>}
        </div>
    );
}

export default RockPaperScissorsGame;
