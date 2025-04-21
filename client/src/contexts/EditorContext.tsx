import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLevels } from '../lib/stores/useLevels';
import { Level, Card, CardType } from '../types';

interface EditorContextProps {
  currentLevel: Level | null;
  createNewLevel: () => void;
  updateLevelDetails: (details: Partial<Level>) => void;
  addCard: (type: CardType) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
  saveLevel: () => string;
  loadLevel: (levelId: string) => void;
  resetEditor: () => void;
}

// Helper to create an empty card based on type
const createEmptyCard = (type: CardType): Card => {
  const baseCard = {
    id: uuidv4(),
    type,
    difficulty: 1 as const,
    points: 10,
  };

  switch (type) {
    case 'translation':
      return {
        ...baseCard,
        type: 'translation',
        text: '',
        translation: '',
        language: 'en',
        targetLanguage: 'es',
      };
    case 'match':
      return {
        ...baseCard,
        type: 'match',
        pairs: [{ term: '', match: '' }],
        language: 'en',
      };
    case 'spelling':
      return {
        ...baseCard,
        type: 'spelling',
        text: '',
        language: 'en',
      };
    case 'multiplechoice':
      return {
        ...baseCard,
        type: 'multiplechoice',
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        language: 'en',
      };
    case 'fillblank':
      return {
        ...baseCard,
        type: 'fillblank',
        text: '',
        blanks: [],
        language: 'en',
      };
  }
};

// Create a template for new levels
const createEmptyLevel = (): Level => ({
  id: uuidv4(),
  name: 'New Level',
  description: 'A custom language learning level',
  creator: 'You',
  language: 'en',
  targetLanguage: 'es',
  difficulty: 1,
  cards: [],
  minPlayers: 1,
  maxPlayers: 4,
});

const EditorContext = createContext<EditorContextProps | undefined>(undefined);

export const EditorContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const { addLevel, updateLevel, getLevelById } = useLevels();

  // Create a new empty level
  const createNewLevel = () => {
    setCurrentLevel(createEmptyLevel());
  };

  // Update level details
  const updateLevelDetails = (details: Partial<Level>) => {
    if (!currentLevel) return;
    setCurrentLevel({ ...currentLevel, ...details });
  };

  // Add a new card to the current level
  const addCard = (type: CardType) => {
    if (!currentLevel) return;
    const newCard = createEmptyCard(type);
    setCurrentLevel({
      ...currentLevel,
      cards: [...currentLevel.cards, newCard],
    });
  };

  // Update a specific card
  const updateCard = (cardId: string, updates: Partial<Card>) => {
    if (!currentLevel) return;
    
    const updatedCards = currentLevel.cards.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    );
    
    setCurrentLevel({
      ...currentLevel,
      cards: updatedCards,
    });
  };

  // Remove a card
  const removeCard = (cardId: string) => {
    if (!currentLevel) return;
    
    setCurrentLevel({
      ...currentLevel,
      cards: currentLevel.cards.filter(card => card.id !== cardId),
    });
  };

  // Save the current level
  const saveLevel = () => {
    if (!currentLevel) return '';
    
    // Check if it's a new level or an update
    if (getLevelById(currentLevel.id)) {
      updateLevel(currentLevel);
    } else {
      addLevel(currentLevel);
    }
    
    return currentLevel.id;
  };

  // Load a level for editing
  const loadLevel = (levelId: string) => {
    const level = getLevelById(levelId);
    if (level) {
      // Create a copy to not modify the original
      setCurrentLevel({ ...level });
    }
  };

  // Reset the editor
  const resetEditor = () => {
    setCurrentLevel(null);
  };

  const value = {
    currentLevel,
    createNewLevel,
    updateLevelDetails,
    addCard,
    updateCard,
    removeCard,
    saveLevel,
    loadLevel,
    resetEditor,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorContextProvider');
  }
  return context;
};
