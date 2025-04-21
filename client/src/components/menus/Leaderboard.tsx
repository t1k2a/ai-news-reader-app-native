import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LeaderboardEntry, Level } from '../../types';
import { getLocalStorage } from '../../lib/utils';
import { useLevels } from '../../lib/stores/useLevels';
import { ArrowLeft, Medal, Search } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { levels } = useLevels();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // Load leaderboard data from local storage
  useEffect(() => {
    const storedData = getLocalStorage('linguaplay-leaderboard') || [];
    setLeaderboardData(storedData);
  }, []);
  
  // Filter entries based on search and level filter
  const filteredEntries = leaderboardData.filter(entry => {
    const matchesSearch = entry.playerName.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'all' || entry.levelId === levelFilter;
    
    return matchesSearch && matchesLevel;
  });
  
  // Sort entries by score (highest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => b.score - a.score);
  
  // Get level name from ID
  const getLevelName = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : 'Unknown Level';
  };
  
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">Leaderboard</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>High Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {sortedEntries.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No leaderboard entries yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Play some games to see your scores here
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 py-2 font-medium border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Player</div>
                <div className="col-span-4">Level</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right">Date</div>
              </div>
              
              {sortedEntries.map((entry, index) => (
                <div 
                  key={`${entry.playerName}-${entry.levelId}-${entry.date}`}
                  className="grid grid-cols-12 py-2 border-b border-muted hover:bg-muted/50 rounded-sm"
                >
                  <div className="col-span-1 flex items-center">
                    {index === 0 && (
                      <Medal className="h-5 w-5 text-yellow-500" />
                    )}
                    {index === 1 && (
                      <Medal className="h-5 w-5 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Medal className="h-5 w-5 text-amber-700" />
                    )}
                    {index > 2 && (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div className="col-span-3 font-medium">{entry.playerName}</div>
                  <div className="col-span-4 truncate">{entry.levelName || getLevelName(entry.levelId)}</div>
                  <div className="col-span-2 text-right font-mono">{entry.score}</div>
                  <div className="col-span-2 text-right text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
