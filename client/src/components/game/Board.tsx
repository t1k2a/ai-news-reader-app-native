import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import Card from './Card';
import Scoreboard from './Scoreboard';
import Player from './Player';
import { useAudio } from '../../lib/stores/useAudio';
import { Button } from '../ui/button';
import { Card as CardUI } from '../ui/card';
import { Progress } from '../ui/progress';
import { useGame } from '../../lib/stores/useGame';

const Board: React.FC = () => {
  const { restart } = useGame();
  const { gameState, currentLevel, currentCard, players, answerCard, nextPlayer, endGame } = useGameContext();
  const { playHit, playSuccess } = useAudio();
  const [timeLeft, setTimeLeft] = useState(gameState.roundTimeLimit);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  
  // Timer effect
  useEffect(() => {
    if (showResult !== null || !currentCard) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAnswer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentCard, showResult]);
  
  // Reset timer when new card is shown
  useEffect(() => {
    if (currentCard) {
      setTimeLeft(gameState.roundTimeLimit);
      setShowResult(null);
    }
  }, [currentCard, gameState.roundTimeLimit]);
  
  // Check for game end
  useEffect(() => {
    if (currentLevel && currentCard === null && gameState.currentCardIndex >= currentLevel.cards.length) {
      endGame();
    }
  }, [currentCard, currentLevel, gameState.currentCardIndex, endGame]);
  
  const handleAnswer = (correct: boolean) => {
    if (showResult !== null) return;
    
    // Play appropriate sound
    if (correct) {
      playSuccess();
    } else {
      playHit();
    }
    
    // Update score and show result
    answerCard(correct);
    setShowResult(correct);
    
    // Move to next card/player after a delay
    setTimeout(() => {
      setShowResult(null);
      nextPlayer();
    }, 1500);
  };
  
  const currentPlayer = players[gameState.currentPlayerIndex];
  
  if (!currentLevel || !currentCard) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-6">Final Scores:</p>
        <Scoreboard players={players} />
        <Button 
          onClick={() => restart()} 
          className="mt-8"
          size="lg"
        >
          Back to Menu
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{currentLevel.name}</h1>
        <div className="text-sm text-muted-foreground">
          Card {gameState.currentCardIndex + 1} of {currentLevel.cards.length}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Left side - Player info and scoreboard */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          <CardUI>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">Current Player</h2>
              <Player player={currentPlayer} />
            </div>
          </CardUI>
          
          <CardUI>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">Scoreboard</h2>
              <Scoreboard players={players} />
            </div>
          </CardUI>
        </div>
        
        {/* Right side - Game card */}
        <div className="w-full md:w-3/4 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <Progress value={(timeLeft / gameState.roundTimeLimit) * 100} className="flex-1" />
            <span className="text-sm font-mono">{timeLeft}s</span>
          </div>
          
          <div className="flex-1 flex flex-col">
            <Card 
              card={currentCard} 
              onAnswer={handleAnswer} 
              showResult={showResult}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
