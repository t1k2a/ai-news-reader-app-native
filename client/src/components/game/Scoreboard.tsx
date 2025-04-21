import React, { useMemo } from 'react';
import { Player as PlayerType } from '../../types';
import Player from './Player';

interface ScoreboardProps {
  players: PlayerType[];
  className?: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, className }) => {
  // Sort players by score (highest first)
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);
  
  // Find the winner (highest score)
  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
  const hasWinner = winner && winner.score > 0;
  
  return (
    <div className={className}>
      <div className="space-y-2">
        {sortedPlayers.map((player) => (
          <Player
            key={player.id}
            player={player}
            isWinner={hasWinner && player.id === winner.id}
          />
        ))}
        
        {players.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No players yet
          </p>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
