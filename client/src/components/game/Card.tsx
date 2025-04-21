import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../../types';
import { Card as CardUI, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface CardProps {
  card: CardType;
  onAnswer: (correct: boolean) => void;
  showResult: boolean | null;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, onAnswer, showResult, className }) => {
  const [answer, setAnswer] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  
  // Reset state when card changes
  useEffect(() => {
    setAnswer('');
    setSelectedOption(null);
    setMatchedPairs({});
    setSelectedTerm(null);
    setBlankInputs(card.type === 'fillblank' ? Array(card.blanks.length).fill('') : []);
  }, [card]);
  
  const getDifficultyLabel = (diff: number) => {
    switch (diff) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };
  
  const renderDifficultyBadge = () => (
    <Badge variant={card.difficulty === 1 ? 'outline' : card.difficulty === 2 ? 'secondary' : 'destructive'}>
      {getDifficultyLabel(card.difficulty)} • {card.points} pts
    </Badge>
  );
  
  const renderCard = () => {
    switch (card.type) {
      case 'translation':
        return renderTranslationCard();
      case 'match':
        return renderMatchCard();
      case 'spelling':
        return renderSpellingCard();
      case 'multiplechoice':
        return renderMultipleChoiceCard();
      case 'fillblank':
        return renderFillBlankCard();
      default:
        return <p>Unknown card type</p>;
    }
  };
  
  const renderTranslationCard = () => {
    const translationCard = card as CardType & { type: 'translation' };
    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Translation</CardTitle>
            {renderDifficultyBadge()}
          </div>
          <CardDescription>
            Translate the following text from {translationCard.language} to {translationCard.targetLanguage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-2xl font-semibold mb-6 p-4 bg-muted/50 rounded-md text-center">
            {translationCard.text}
          </div>
          <div className="mt-auto">
            <Input
              placeholder="Enter translation..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mb-4"
              autoFocus
              disabled={showResult !== null}
            />
            <Button 
              onClick={() => checkTranslation()} 
              className="w-full"
              disabled={answer.trim() === '' || showResult !== null}
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </>
    );
  };
  
  const renderMatchCard = () => {
    const matchCard = card as CardType & { type: 'match' };
    const allTerms = matchCard.pairs.map(p => p.term);
    const allMatches = matchCard.pairs.map(p => p.match);
    
    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Match Pairs</CardTitle>
            {renderDifficultyBadge()}
          </div>
          <CardDescription>Match each term with its correct pair</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {allTerms.map((term, i) => (
                <Button
                  key={`term-${i}`}
                  variant={selectedTerm === term ? "default" : term in matchedPairs ? "outline" : "secondary"}
                  className={cn("w-full justify-start", term in matchedPairs && "opacity-50")}
                  onClick={() => handleTermClick(term)}
                  disabled={term in matchedPairs || showResult !== null}
                >
                  {term}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {allMatches.map((match, i) => {
                const isMatched = Object.values(matchedPairs).includes(match);
                return (
                  <Button
                    key={`match-${i}`}
                    variant={isMatched ? "outline" : "secondary"}
                    className={cn("w-full justify-start", isMatched && "opacity-50")}
                    onClick={() => handleMatchClick(match)}
                    disabled={isMatched || selectedTerm === null || showResult !== null}
                  >
                    {match}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={checkMatches} 
            className="w-full"
            disabled={matchCard.pairs.length !== Object.keys(matchedPairs).length || showResult !== null}
          >
            Submit
          </Button>
        </CardFooter>
      </>
    );
  };
  
  const renderSpellingCard = () => {
    const spellingCard = card as CardType & { type: 'spelling' };
    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Spelling</CardTitle>
            {renderDifficultyBadge()}
          </div>
          <CardDescription>Write the correct spelling of this word</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-2xl font-semibold mb-6 p-4 bg-muted/50 rounded-md text-center">
            {/* Audio would be played here if available */}
            {spellingCard.text.split('').map((char, i) => (
              <span key={i} className="opacity-0">
                {char}
              </span>
            ))}
            <p className="text-sm text-muted-foreground mt-2">
              (Word has {spellingCard.text.length} letters)
            </p>
          </div>
          <div className="mt-auto">
            <Input
              placeholder="Enter the spelling..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mb-4"
              autoFocus
              disabled={showResult !== null}
            />
            <Button 
              onClick={() => checkSpelling()} 
              className="w-full"
              disabled={answer.trim() === '' || showResult !== null}
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </>
    );
  };
  
  const renderMultipleChoiceCard = () => {
    const mcCard = card as CardType & { type: 'multiplechoice' };
    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Multiple Choice</CardTitle>
            {renderDifficultyBadge()}
          </div>
          <CardDescription>Select the correct answer</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-xl font-semibold mb-6 p-4 bg-muted/50 rounded-md">
            {mcCard.question}
          </div>
          <div className="space-y-2 flex-1">
            {mcCard.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedOption === index ? "default" : "outline"}
                className="w-full justify-start h-auto py-3 text-left"
                onClick={() => setSelectedOption(index)}
                disabled={showResult !== null}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => checkMultipleChoice()} 
            className="w-full"
            disabled={selectedOption === null || showResult !== null}
          >
            Submit
          </Button>
        </CardFooter>
      </>
    );
  };
  
  const renderFillBlankCard = () => {
    const fbCard = card as CardType & { type: 'fillblank' };
    
    // Split text into segments with blanks
    const textSegments: React.ReactNode[] = [];
    let lastIndex = 0;
    
    fbCard.blanks.forEach((blank, blankIndex) => {
      // Add text before blank
      textSegments.push(fbCard.text.substring(lastIndex, blank.index));
      
      // Add input for blank
      textSegments.push(
        <Input
          key={`blank-${blankIndex}`}
          value={blankInputs[blankIndex] || ''}
          onChange={(e) => {
            const newInputs = [...blankInputs];
            newInputs[blankIndex] = e.target.value;
            setBlankInputs(newInputs);
          }}
          className="inline-block w-24 mx-1"
          disabled={showResult !== null}
        />
      );
      
      lastIndex = blank.index;
    });
    
    // Add remaining text
    textSegments.push(fbCard.text.substring(lastIndex));
    
    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Fill in the Blanks</CardTitle>
            {renderDifficultyBadge()}
          </div>
          <CardDescription>Fill in the missing words</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-lg mb-6 p-4 bg-muted/50 rounded-md leading-loose">
            {textSegments}
          </div>
          <div className="mt-auto">
            <Button 
              onClick={() => checkFillBlanks()} 
              className="w-full"
              disabled={blankInputs.some(input => input.trim() === '') || showResult !== null}
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </>
    );
  };
  
  const checkTranslation = () => {
    const translationCard = card as CardType & { type: 'translation' };
    // For simplicity, check for case-insensitive contains
    // A more sophisticated approach might use fuzzy matching or language-specific validation
    const isCorrect = 
      translationCard.translation.toLowerCase().includes(answer.toLowerCase()) ||
      answer.toLowerCase().includes(translationCard.translation.toLowerCase());
    onAnswer(isCorrect);
  };
  
  const handleTermClick = (term: string) => {
    setSelectedTerm(term);
  };
  
  const handleMatchClick = (match: string) => {
    if (selectedTerm) {
      setMatchedPairs({
        ...matchedPairs,
        [selectedTerm]: match
      });
      setSelectedTerm(null);
    }
  };
  
  const checkMatches = () => {
    const matchCard = card as CardType & { type: 'match' };
    const isCorrect = matchCard.pairs.every(pair => 
      matchedPairs[pair.term] === pair.match
    );
    onAnswer(isCorrect);
  };
  
  const checkSpelling = () => {
    const spellingCard = card as CardType & { type: 'spelling' };
    const isCorrect = answer.toLowerCase().trim() === spellingCard.text.toLowerCase().trim();
    onAnswer(isCorrect);
  };
  
  const checkMultipleChoice = () => {
    const mcCard = card as CardType & { type: 'multiplechoice' };
    const isCorrect = selectedOption === mcCard.correctAnswerIndex;
    onAnswer(isCorrect);
  };
  
  const checkFillBlanks = () => {
    const fbCard = card as CardType & { type: 'fillblank' };
    const isCorrect = fbCard.blanks.every((blank, index) => 
      blankInputs[index].toLowerCase().trim() === blank.answer.toLowerCase().trim()
    );
    onAnswer(isCorrect);
  };
  
  const renderResult = () => {
    if (showResult === null) return null;
    
    return (
      <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
        {showResult ? (
          <>
            <CheckCircle className="text-green-500 h-16 w-16 mb-4" />
            <h3 className="text-2xl font-bold text-green-500 mb-2">Correct!</h3>
            <p className="text-xl">+{card.points} points</p>
          </>
        ) : (
          <>
            <XCircle className="text-red-500 h-16 w-16 mb-4" />
            <h3 className="text-2xl font-bold text-red-500 mb-2">Incorrect</h3>
            <p className="text-muted-foreground">
              {card.type === 'translation' && `The correct answer was: ${(card as any).translation}`}
              {card.type === 'spelling' && `The correct spelling was: ${(card as any).text}`}
              {card.type === 'multiplechoice' && `The correct answer was: ${(card as any).options[(card as any).correctAnswerIndex]}`}
            </p>
          </>
        )}
      </div>
    );
  };
  
  return (
    <CardUI className={cn("relative flex flex-col overflow-hidden", className)}>
      {renderCard()}
      {renderResult()}
    </CardUI>
  );
};

export default Card;
