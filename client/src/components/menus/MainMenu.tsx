import React, { useState } from 'react';
import { Button } from '../ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Input } from '../ui/input';
import { GamePhase } from '../../lib/stores/useGame';
import { useLevels } from '../../lib/stores/useLevels';
import { useAudio } from '../../lib/stores/useAudio';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Volume2, VolumeX, Edit, Play, Trophy, BookOpen, Import } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (phase: GamePhase | "menu" | "level_select" | "player_setup" | "editor" | "leaderboard") => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const { backgroundMusic, toggleMute, isMuted } = useAudio();
  const { importLevel } = useLevels();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  
  // Start playing background music when component mounts
  React.useEffect(() => {
    if (backgroundMusic) {
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic]);
  
  const handleImport = () => {
    if (!importCode.trim()) {
      toast.error('Please enter a level code');
      return;
    }
    
    const success = importLevel(importCode);
    if (success) {
      toast.success('Level imported successfully!');
      setImportDialogOpen(false);
      setImportCode('');
    } else {
      toast.error('Invalid level code. Please check and try again.');
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
            LinguaPlay
          </h1>
          <p className="text-muted-foreground">Learn languages through fun challenges</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Play Now</CardTitle>
            <CardDescription>Start a new game or create your own levels</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => onNavigate('level_select')}
            >
              <Play className="mr-2 h-5 w-5" />
              Play Game
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={() => onNavigate('editor')}
            >
              <Edit className="mr-2 h-5 w-5" />
              Level Editor
            </Button>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>More Options</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full"
              onClick={() => onNavigate('leaderboard')}
            >
              <Trophy className="mr-2 h-5 w-5" />
              Leaderboard
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setImportDialogOpen(true)}
            >
              <Import className="mr-2 h-5 w-5" />
              Import Level
            </Button>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-5 w-5 text-primary" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Level</DialogTitle>
            <DialogDescription>
              Paste a level code to import a custom level
            </DialogDescription>
          </DialogHeader>
          <Input
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Paste level code here..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainMenu;
