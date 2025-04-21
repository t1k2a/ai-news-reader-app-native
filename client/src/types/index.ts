// Player-related types
export interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
  isActive: boolean;
}

// Card types for language learning
export type CardType = "translation" | "match" | "spelling" | "multiplechoice" | "fillblank";

export interface BaseCard {
  id: string;
  type: CardType;
  difficulty: 1 | 2 | 3; // 1 = easy, 2 = medium, 3 = hard
  points: number;
}

export interface TranslationCard extends BaseCard {
  type: "translation";
  text: string;
  translation: string;
  language: string;
  targetLanguage: string;
}

export interface MatchCard extends BaseCard {
  type: "match";
  pairs: Array<{ term: string; match: string }>;
  language: string;
}

export interface SpellingCard extends BaseCard {
  type: "spelling";
  audio?: string; // Optional audio file path
  text: string;
  language: string;
}

export interface MultipleChoiceCard extends BaseCard {
  type: "multiplechoice";
  question: string;
  options: string[];
  correctAnswerIndex: number;
  language: string;
}

export interface FillBlankCard extends BaseCard {
  type: "fillblank";
  text: string;
  blanks: Array<{ index: number; answer: string }>;
  language: string;
}

export type Card = 
  | TranslationCard 
  | MatchCard 
  | SpellingCard 
  | MultipleChoiceCard 
  | FillBlankCard;

// Level types
export interface Level {
  id: string;
  name: string;
  description: string;
  creator: string;
  language: string;
  targetLanguage?: string;
  difficulty: 1 | 2 | 3;
  cards: Card[];
  minPlayers: number;
  maxPlayers: number;
  isDefault?: boolean;
}

// Game state
export interface GameState {
  levelId: string | null;
  players: Player[];
  currentPlayerIndex: number;
  currentCardIndex: number;
  gameOver: boolean;
  roundTimeLimit: number; // in seconds
}

// Leaderboard entry
export interface LeaderboardEntry {
  playerName: string;
  levelId: string;
  levelName: string;
  score: number;
  date: string;
}
