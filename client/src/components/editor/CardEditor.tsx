import React, { useState } from 'react';
import { Card, CardType } from '../../types';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CardEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ card, onUpdate }) => {
  const renderEditor = () => {
    switch (card.type) {
      case 'translation':
        return renderTranslationEditor();
      case 'match':
        return renderMatchEditor();
      case 'spelling':
        return renderSpellingEditor();
      case 'multiplechoice':
        return renderMultipleChoiceEditor();
      case 'fillblank':
        return renderFillBlankEditor();
      default:
        return <p>Unknown card type</p>;
    }
  };
  
  const renderDifficultySelector = () => (
    <div className="space-y-2 mb-4">
      <Label htmlFor="difficulty">Difficulty (Points: {card.points})</Label>
      <Select
        value={card.difficulty.toString()}
        onValueChange={(value) => {
          const difficulty = parseInt(value) as 1 | 2 | 3;
          // Assign points based on difficulty
          const points = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 30;
          onUpdate({ difficulty, points });
        }}
      >
        <SelectTrigger id="difficulty">
          <SelectValue placeholder="Select difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Easy (10 points)</SelectItem>
          <SelectItem value="2">Medium (20 points)</SelectItem>
          <SelectItem value="3">Hard (30 points)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  const renderTranslationEditor = () => {
    const translationCard = card as Card & { type: 'translation' };
    return (
      <div className="space-y-4">
        {renderDifficultySelector()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="text">Original Text ({translationCard.language})</Label>
            <Textarea
              id="text"
              value={translationCard.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Enter text to translate..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="translation">Translation ({translationCard.targetLanguage})</Label>
            <Textarea
              id="translation"
              value={translationCard.translation}
              onChange={(e) => onUpdate({ translation: e.target.value })}
              placeholder="Enter correct translation..."
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };
  
  const renderMatchEditor = () => {
    const matchCard = card as Card & { type: 'match' };
    return (
      <div className="space-y-4">
        {renderDifficultySelector()}
        
        <Label>Matching Pairs</Label>
        {matchCard.pairs.map((pair, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <Input
              value={pair.term}
              onChange={(e) => {
                const newPairs = [...matchCard.pairs];
                newPairs[index] = { ...pair, term: e.target.value };
                onUpdate({ pairs: newPairs });
              }}
              placeholder="Term"
              className="flex-1"
            />
            <span>→</span>
            <Input
              value={pair.match}
              onChange={(e) => {
                const newPairs = [...matchCard.pairs];
                newPairs[index] = { ...pair, match: e.target.value };
                onUpdate({ pairs: newPairs });
              }}
              placeholder="Match"
              className="flex-1"
            />
            {matchCard.pairs.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newPairs = [...matchCard.pairs];
                  newPairs.splice(index, 1);
                  onUpdate({ pairs: newPairs });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newPairs = [...matchCard.pairs, { term: '', match: '' }];
            onUpdate({ pairs: newPairs });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Pair
        </Button>
      </div>
    );
  };
  
  const renderSpellingEditor = () => {
    const spellingCard = card as Card & { type: 'spelling' };
    return (
      <div className="space-y-4">
        {renderDifficultySelector()}
        
        <div className="space-y-2">
          <Label htmlFor="text">Word to Spell</Label>
          <Input
            id="text"
            value={spellingCard.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Enter word or phrase to spell..."
          />
          <p className="text-xs text-muted-foreground">
            Players will need to correctly spell this word without seeing it
          </p>
        </div>
      </div>
    );
  };
  
  const renderMultipleChoiceEditor = () => {
    const mcCard = card as Card & { type: 'multiplechoice' };
    return (
      <div className="space-y-4">
        {renderDifficultySelector()}
        
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            value={mcCard.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Enter question..."
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Options</Label>
          {mcCard.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <Badge
                variant={mcCard.correctAnswerIndex === index ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onUpdate({ correctAnswerIndex: index })}
              >
                {mcCard.correctAnswerIndex === index ? "Correct" : "Option"}
              </Badge>
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...mcCard.options];
                  newOptions[index] = e.target.value;
                  onUpdate({ options: newOptions });
                }}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              {mcCard.options.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...mcCard.options];
                    newOptions.splice(index, 1);
                    
                    // Adjust correct answer index if needed
                    let newCorrectIndex = mcCard.correctAnswerIndex;
                    if (index === mcCard.correctAnswerIndex) {
                      newCorrectIndex = 0;
                    } else if (index < mcCard.correctAnswerIndex) {
                      newCorrectIndex--;
                    }
                    
                    onUpdate({ 
                      options: newOptions,
                      correctAnswerIndex: newCorrectIndex 
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {mcCard.options.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [...mcCard.options, ''];
                onUpdate({ options: newOptions });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // State for managing the text input and extracted blanks
  const [fillBlankText, setFillBlankText] = useState((card as any).text || '');
  
  const renderFillBlankEditor = () => {
    const fbCard = card as Card & { type: 'fillblank' };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFillBlankText(e.target.value);
      
      // Extract blanks from text using [blank] as markers
      const text = e.target.value;
      const regex = /\[([^\]]+)\]/g;
      const blanks: Array<{ index: number; answer: string }> = [];
      let match;
      let plainText = text;
      
      // First collect all blanks
      while ((match = regex.exec(text)) !== null) {
        blanks.push({
          index: match.index,
          answer: match[1]
        });
      }
      
      // Then replace [blanks] with actual blanks in the text
      plainText = text.replace(/\[([^\]]+)\]/g, '____');
      
      // Update the card
      onUpdate({ 
        text: plainText,
        blanks
      });
    };
    
    const renderBlankList = () => {
      // Parse current blanks from the text
      const regex = /\[([^\]]+)\]/g;
      const matches: string[] = [];
      let match;
      
      while ((match = regex.exec(fillBlankText)) !== null) {
        matches.push(match[1]);
      }
      
      return (
        <div className="mt-4">
          <Label className="mb-2 block">Detected Blanks:</Label>
          {matches.length > 0 ? (
            <div className="space-y-2">
              {matches.map((blank, i) => (
                <Badge key={i} className="mr-2">
                  {blank}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No blanks detected. Use [word] syntax to create blanks.
            </p>
          )}
        </div>
      );
    };
    
    return (
      <div className="space-y-4">
        {renderDifficultySelector()}
        
        <div className="space-y-2">
          <Label htmlFor="fillBlankText">Text with Blanks</Label>
          <Textarea
            id="fillBlankText"
            value={fillBlankText}
            onChange={handleTextChange}
            placeholder="Enter text with [blanks] in brackets..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Use [word] syntax to mark words that should be blank. Example: "The [cat] sat on the [mat]."
          </p>
        </div>
        
        {renderBlankList()}
      </div>
    );
  };
  
  return <div>{renderEditor()}</div>;
};

export default CardEditor;
