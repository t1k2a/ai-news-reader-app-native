import React, { useEffect } from 'react';
import { EditorContextProvider, useEditorContext } from '../../contexts/EditorContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { CardType } from '../../types';
import CardEditor from './CardEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ArrowLeft, Plus, Save, Share2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface LevelEditorProps {
  onBack: () => void;
}

// Helper component for the actual editor content
const EditorContent: React.FC<LevelEditorProps> = ({ onBack }) => {
  const { 
    currentLevel, 
    createNewLevel, 
    updateLevelDetails, 
    addCard, 
    updateCard, 
    removeCard, 
    saveLevel,
    resetEditor
  } = useEditorContext();
  
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  const [shareCode, setShareCode] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('details');
  
  useEffect(() => {
    if (!currentLevel) {
      createNewLevel();
    }
  }, [currentLevel, createNewLevel]);
  
  const handleSave = () => {
    if (!currentLevel) return;
    
    // Validate level details
    if (!currentLevel.name.trim()) {
      toast.error('Level name is required');
      return;
    }
    
    if (currentLevel.cards.length === 0) {
      toast.error('Add at least one card to your level');
      return;
    }
    
    const levelId = saveLevel();
    toast.success('Level saved successfully!');
    
    // Generate share code
    const shareId = btoa(levelId);
    setShareCode(shareId);
  };
  
  const handleAddCard = (type: CardType) => {
    addCard(type);
    setActiveTab('cards');
  };
  
  const handleBack = () => {
    resetEditor();
    onBack();
  };
  
  if (!currentLevel) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBack} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Level
          </Button>
          
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!shareCode}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Level</DialogTitle>
                <DialogDescription>
                  Share this code with others so they can import your level.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input value={shareCode} readOnly className="flex-1" />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareCode);
                    toast.success('Share code copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Level Details</TabsTrigger>
          <TabsTrigger value="cards" disabled={!currentLevel.name}>Cards ({currentLevel.cards.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Level Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Level Name</Label>
                <Input
                  id="name"
                  value={currentLevel.name}
                  onChange={(e) => updateLevelDetails({ name: e.target.value })}
                  placeholder="Enter level name..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentLevel.description}
                  onChange={(e) => updateLevelDetails({ description: e.target.value })}
                  placeholder="Describe your level..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Select
                    value={currentLevel.language}
                    onValueChange={(value) => updateLevelDetails({ language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetLanguage">Target Language</Label>
                  <Select
                    value={currentLevel.targetLanguage || ''}
                    onValueChange={(value) => updateLevelDetails({ targetLanguage: value })}
                  >
                    <SelectTrigger id="targetLanguage">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={currentLevel.difficulty.toString()}
                    onValueChange={(value) => updateLevelDetails({ difficulty: parseInt(value) as 1 | 2 | 3 })}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="players">Player Count</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentLevel.minPlayers.toString()}
                      onValueChange={(value) => updateLevelDetails({ minPlayers: parseInt(value) })}
                    >
                      <SelectTrigger id="minPlayers" className="flex-1">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select
                      value={currentLevel.maxPlayers.toString()}
                      onValueChange={(value) => updateLevelDetails({ maxPlayers: parseInt(value) })}
                    >
                      <SelectTrigger id="maxPlayers" className="flex-1">
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab('cards')} disabled={!currentLevel.name}>
                Continue to Cards
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="cards" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => handleAddCard('translation')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Translation
                </Button>
                <Button variant="outline" onClick={() => handleAddCard('match')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Matching
                </Button>
                <Button variant="outline" onClick={() => handleAddCard('spelling')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Spelling
                </Button>
                <Button variant="outline" onClick={() => handleAddCard('multiplechoice')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Multiple Choice
                </Button>
                <Button variant="outline" onClick={() => handleAddCard('fillblank')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Fill in Blanks
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {currentLevel.cards.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No cards added yet</p>
              <p className="text-sm text-muted-foreground">
                Use the options above to add language learning cards to your level
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentLevel.cards.map((card, index) => (
                <Card key={card.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        {index + 1}. {card.type.charAt(0).toUpperCase() + card.type.slice(1)} Card
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardEditor 
                      card={card} 
                      onUpdate={(updates) => updateCard(card.id, updates)} 
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper component that provides the editor context
const LevelEditor: React.FC<LevelEditorProps> = ({ onBack }) => {
  return (
    <EditorContextProvider>
      <EditorContent onBack={onBack} />
    </EditorContextProvider>
  );
};

export default LevelEditor;
