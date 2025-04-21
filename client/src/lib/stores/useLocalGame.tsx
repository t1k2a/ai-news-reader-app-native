import { create } from "zustand";
import { Player, GameState } from "../../types";

interface LocalGameState {
  gameState: GameState;
  
  // Actions
  setLevel: (levelId: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: number) => void;
  setCurrentPlayerIndex: (index: number) => void;
  nextPlayer: () => void;
  nextCard: () => void;
  updateScore: (playerId: number, points: number) => void;
  setGameOver: (isOver: boolean) => void;
  resetGame: () => void;
}

const initialGameState: GameState = {
  levelId: null,
  players: [],
  currentPlayerIndex: 0,
  currentCardIndex: 0,
  gameOver: false,
  roundTimeLimit: 30,
};

export const useLocalGame = create<LocalGameState>((set) => ({
  gameState: initialGameState,
  
  setLevel: (levelId: string) => 
    set((state) => ({
      gameState: {
        ...state.gameState,
        levelId,
        currentCardIndex: 0,
        gameOver: false,
      },
    })),
  
  addPlayer: (player: Player) => 
    set((state) => {
      // Set the first player as active if this is the first player
      const isFirstPlayer = state.gameState.players.length === 0;
      const updatedPlayer = isFirstPlayer ? { ...player, isActive: true } : player;
      
      return {
        gameState: {
          ...state.gameState,
          players: [...state.gameState.players, updatedPlayer],
        },
      };
    }),
  
  removePlayer: (playerId: number) => 
    set((state) => ({
      gameState: {
        ...state.gameState,
        players: state.gameState.players.filter((p) => p.id !== playerId),
      },
    })),
  
  setCurrentPlayerIndex: (index: number) => 
    set((state) => {
      // Update the active player
      const updatedPlayers = state.gameState.players.map((player, idx) => ({
        ...player,
        isActive: idx === index,
      }));
      
      return {
        gameState: {
          ...state.gameState,
          currentPlayerIndex: index,
          players: updatedPlayers,
        },
      };
    }),
  
  nextPlayer: () => 
    set((state) => {
      const players = state.gameState.players;
      if (players.length === 0) return state;
      
      // Calculate the next player index
      const nextIndex = (state.gameState.currentPlayerIndex + 1) % players.length;
      
      // Update the active player
      const updatedPlayers = players.map((player, idx) => ({
        ...player,
        isActive: idx === nextIndex,
      }));
      
      return {
        gameState: {
          ...state.gameState,
          currentPlayerIndex: nextIndex,
          players: updatedPlayers,
        },
      };
    }),
  
  nextCard: () => 
    set((state) => ({
      gameState: {
        ...state.gameState,
        currentCardIndex: state.gameState.currentCardIndex + 1,
      },
    })),
  
  updateScore: (playerId: number, points: number) => 
    set((state) => ({
      gameState: {
        ...state.gameState,
        players: state.gameState.players.map((player) => 
          player.id === playerId
            ? { ...player, score: player.score + points }
            : player
        ),
      },
    })),
  
  setGameOver: (isOver: boolean) => 
    set((state) => ({
      gameState: {
        ...state.gameState,
        gameOver: isOver,
      },
    })),
  
  resetGame: () => 
    set({
      gameState: initialGameState,
    }),
}));
