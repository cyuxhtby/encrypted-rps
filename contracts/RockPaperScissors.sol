// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity >=0.8.13 <0.8.20;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";

contract RockPaperScissors is EIP712WithModifier {
    enum Choice { ROCK, PAPER, SCISSORS } // 0, 1, 2
    
    struct Player {
        address playerAddress;
        euint8 encryptedChoice;
        bool hasPlayed;
    }

    Player public player1;
    Player public player2;
    bool public gameEnded = false;
    address public winner;

    constructor() EIP712WithModifier("Authorization token", "1") {}

    event WinnerDeclared(address winnerAddress);
    event Draw();

    modifier onlyPlayers() {
        require(msg.sender == player1.playerAddress || msg.sender == player2.playerAddress, "Only players can call this function");
        _;
    }

    modifier onlyGameReady() {
        require(player1.hasPlayed && player2.hasPlayed, "Both players haven't played yet");
        _;
    }

    function joinGame() public {
        require(player1.playerAddress == address(0) || player2.playerAddress == address(0), "Game is full");
        
        if(player1.playerAddress == address(0)) {
            player1.playerAddress = msg.sender;
        } else {
            player2.playerAddress = msg.sender;
        }
    }

    function play(bytes calldata encryptedChoice) public onlyPlayers {
        require(!gameEnded, "Game has ended");

        Player storage currentPlayer = (msg.sender == player1.playerAddress) ? player1 : player2;
        require(!currentPlayer.hasPlayed, "Player has already played");
        currentPlayer.encryptedChoice = TFHE.asEuint8(encryptedChoice);
        currentPlayer.hasPlayed = true;

        if(player1.hasPlayed && player2.hasPlayed) {
            revealWinner();
        }
    }

    function revealWinner() public onlyGameReady {
        require(!gameEnded, "Game already ended");

        uint8 choice1Decrypted = uint8(TFHE.decrypt(player1.encryptedChoice));
        uint8 choice2Decrypted = uint8(TFHE.decrypt(player2.encryptedChoice));

        Choice player1Choice = Choice(choice1Decrypted);
        Choice player2Choice = Choice(choice2Decrypted);

        winner = determineWinner(player1Choice, player2Choice);
    
        gameEnded = true;

        // If winner is address(0), it's a draw
        if (winner != address(0)) {
            emit WinnerDeclared(winner);
        } else {
            emit Draw();
        }
    }

    function determineWinner(Choice choice1, Choice choice2) internal pure returns (address) {
        if (choice1 == choice2) {
            return address(0); // Draw
        }
    
        if ((choice1 == Choice.ROCK && choice2 == Choice.SCISSORS) || 
            (choice1 == Choice.PAPER && choice2 == Choice.ROCK) || 
            (choice1 == Choice.SCISSORS && choice2 == Choice.PAPER)) {
            return player1.playerAddress;
        } else {
            return player2.playerAddress;
        }
    }

    function resetGame() public {
        require(gameEnded, "Game has not ended yet");
        
        player1.hasPlayed = false;
        player1.encryptedChoice = TFHE.NIL8;
        player2.hasPlayed = false;
        player2.encryptedChoice = TFHE.NIL8;
        gameEnded = false;
        winner = address(0);
    }
}
