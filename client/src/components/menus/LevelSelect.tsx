import React, { useState } from 'react';
import { useLevels } from '../../lib/stores/useLevels';
import { Level } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useGameContext } from '../../contexts/GameContext';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Badge } from '../ui/badge';

interface LevelSelectProps {
  onBack: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ onBack }) => {
  const { levels } = useLevels();
  const { startGame } = useGameContext();
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  
  // Get unique languages from levels
  const languages = Array.from(new Set(levels.map(level => level.language)));
  
  // Filter levels based on search and filters
  const filteredLevels = levels.filter(level => {
    const matchesSearch = level.name.toLowerCase().includes(search.toLowerCase()) ||
                         level.description.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || level.language === languageFilter;
    const matchesDifficulty = difficultyFilter === 'all' || level.difficulty === parseInt(difficultyFilter);
    
    return matchesSearch && matchesLanguage && matchesDifficulty;
  });
  
  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
  };
  
  const handleStartGame = () => {
    if (selectedLevel) {
      startGame(selectedLevel.id);
    }
  };
  
  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };
  
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
    };
    return languages[code] || code;
  };
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex-1">Select Level</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search levels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map(lang => (
              <SelectItem key={lang} value={lang}>{getLanguageName(lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="1">Easy</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredLevels.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No levels found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredLevels.map(level => (
            <Card 
              key={level.id} 
              className={selectedLevel?.id === level.id ? "border-primary" : ""}
              onClick={() => handleLevelSelect(level)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle>{level.name}</CardTitle>
                  <Badge variant={level.difficulty === 1 ? "outline" : level.difficulty === 2 ? "secondary" : "destructive"}>
                    {getDifficultyLabel(level.difficulty)}
                  </Badge>
                </div>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold">Language:</span> {getLanguageName(level.language)}
                    {level.targetLanguage && ` → ${getLanguageName(level.targetLanguage)}`}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {level.minPlayers} - {level.maxPlayers} players
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-semibold">Cards:</span> {level.cards.length}
                </div>
              </CardContent>
              <CardFooter>
                {level.isDefault && (
                  <Badge variant="outline" className="mr-auto">Default</Badge>
                )}
                <Button 
                  variant={selectedLevel?.id === level.id ? "default" : "ghost"} 
                  className="ml-auto"
                  onClick={() => handleLevelSelect(level)}
                >
                  Select
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {selectedLevel && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleStartGame}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default LevelSelect;
