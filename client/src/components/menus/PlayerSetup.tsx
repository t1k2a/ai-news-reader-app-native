import React, { useEffect, useState } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { Player } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useGame } from '../../lib/stores/useGame';
import { ArrowLeft, ArrowRight, Plus, UserPlus, X } from 'lucide-react';

interface PlayerSetupProps {
  onBack: () => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onBack }) => {
  const { start } = useGame();
  const { players, addPlayer, removePlayer, currentLevel } = useGameContext();
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const handleAddPlayer = () => {
    if (newPlayerName.trim() === '') return;
    
    // Check if maximum players reached for the level
    if (currentLevel && players.length >= currentLevel.maxPlayers) {
      return;
    }
    
    addPlayer(newPlayerName);
    setNewPlayerName('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };
  
  const handleStartGame = () => {
    if (players.length === 0) return;
    start();
  };
  
  // If no level is selected, go back
  useEffect(() => {
    if (!currentLevel) {
      onBack();
    }
  }, [currentLevel, onBack]);
  
  if (!currentLevel) {
    return null;
  }
  
  return (
    <div className="container mx-auto max-w-md">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">Player Setup</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={20}
              disabled={currentLevel && players.length >= currentLevel.maxPlayers}
            />
            <Button 
              onClick={handleAddPlayer}
              disabled={
                newPlayerName.trim() === '' || 
                (currentLevel && players.length >= currentLevel.maxPlayers)
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {players.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Add players to start</p>
              </div>
            ) : (
              players.map((player: Player) => (
                <div 
                  key={player.id} 
                  className="flex items-center gap-2 p-2 rounded-md border"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1">{player.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePlayer(player.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {currentLevel ? (
              `This level supports ${currentLevel.minPlayers} to ${currentLevel.maxPlayers} players.`
            ) : (
              "Please select a level first."
            )}
          </p>
        </CardFooter>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button 
          size="lg" 
          onClick={handleStartGame} 
          disabled={
            players.length === 0 || 
            (currentLevel && players.length < currentLevel.minPlayers)
          }
        >
          Start Game
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlayerSetup;
