import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalGame } from '../lib/stores/useLocalGame';
import { useLevels } from '../lib/stores/useLevels';
import { Level, Player, Card, GameState } from '../types';
import { useGame } from '../lib/stores/useGame';

interface GameContextProps {
  gameState: GameState;
  currentLevel: Level | null;
  currentCard: Card | null;
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: number) => void;
  startGame: (levelId: string) => void;
  answerCard: (isCorrect: boolean) => void;
  nextPlayer: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
  const { levels } = useLevels();
  const { start, end, restart } = useGame();
  const {
    gameState,
    setLevel,
    addPlayer: addGamePlayer,
    removePlayer: removeGamePlayer,
    nextPlayer: goToNextPlayer,
    updateScore,
    resetGame: clearGame,
  } = useLocalGame();

  // Get the current level based on levelId
  const currentLevel = gameState.levelId 
    ? levels.find(level => level.id === gameState.levelId) || null
    : null;

  // Get the current card based on currentCardIndex
  const currentCard = currentLevel && gameState.currentCardIndex < currentLevel.cards.length
    ? currentLevel.cards[gameState.currentCardIndex]
    : null;

  // Add a player to the game
  const addPlayer = (name: string) => {
    // Generate a random color from a set of predefined, accessible colors
    const colors = [
      '#4361EE', '#3A0CA3', '#F72585', '#4CC9F0',
      '#F77F00', '#7209B7', '#D62828', '#06D6A0'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addGamePlayer({
      id: Date.now(),
      name,
      score: 0,
      color: randomColor,
      isActive: false
    });
  };

  // Remove a player from the game
  const removePlayer = (id: number) => {
    removeGamePlayer(id);
  };

  // Start a new game with the selected level
  const startGame = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;
    
    setLevel(levelId);
    start();
  };

  // Process a player's answer
  const answerCard = (isCorrect: boolean) => {
    if (!currentCard || !currentLevel) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (isCorrect) {
      // Calculate points based on card difficulty
      const points = currentCard.points;
      updateScore(currentPlayer.id, points);
    }
  };

  // Move to the next player
  const nextPlayer = () => {
    goToNextPlayer();
  };

  // End the current game
  const endGame = () => {
    end();
  };

  // Reset the game state
  const resetGame = () => {
    clearGame();
    restart();
  };

  const value = {
    gameState,
    currentLevel,
    currentCard,
    players: gameState.players,
    addPlayer,
    removePlayer,
    startGame,
    answerCard,
    nextPlayer,
    endGame,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameContextProvider');
  }
  return context;
};
