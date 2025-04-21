import React from 'react';
import { Player as PlayerType } from '../../types';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { User, Crown } from 'lucide-react';

interface PlayerProps {
  player: PlayerType;
  showScore?: boolean;
  isWinner?: boolean;
  className?: string;
}

const Player: React.FC<PlayerProps> = ({ 
  player, 
  showScore = true, 
  isWinner = false,
  className 
}) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors",
        player.isActive && "bg-secondary/30",
        className
      )}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: player.color }}
      >
        {isWinner ? (
          <Crown className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{player.name}</p>
          {player.isActive && (
            <Badge variant="outline" className="ml-auto">Active</Badge>
          )}
          {isWinner && (
            <Badge variant="default" className="ml-auto bg-yellow-500">Winner</Badge>
          )}
        </div>
        
        {showScore && (
          <p className="text-sm text-muted-foreground">
            Score: {player.score}
          </p>
        )}
      </div>
    </div>
  );
};

export default Player;
