import { Level } from "../types";
import { v4 as uuidv4 } from "uuid";

export const defaultLevels: Level[] = [
  {
    id: "basic-spanish-1",
    name: "Basic Spanish Vocabulary",
    description: "Learn essential Spanish words and phrases for beginners",
    creator: "System",
    language: "en",
    targetLanguage: "es",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 4,
    cards: [
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Hello",
        translation: "Hola",
        language: "en",
        targetLanguage: "es"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Thank you",
        translation: "Gracias",
        language: "en",
        targetLanguage: "es"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Goodbye",
        translation: "Adiós",
        language: "en",
        targetLanguage: "es"
      },
      {
        id: uuidv4(),
        type: "match",
        difficulty: 1,
        points: 10,
        pairs: [
          { term: "water", match: "agua" },
          { term: "food", match: "comida" },
          { term: "house", match: "casa" }
        ],
        language: "en"
      },
      {
        id: uuidv4(),
        type: "multiplechoice",
        difficulty: 1,
        points: 10,
        question: "What is 'book' in Spanish?",
        options: ["libro", "papel", "pluma", "lápiz"],
        correctAnswerIndex: 0,
        language: "en"
      }
    ]
  },
  {
    id: "french-greetings",
    name: "French Greetings",
    description: "Learn common French greetings and expressions",
    creator: "System",
    language: "en",
    targetLanguage: "fr",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 4,
    cards: [
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Good morning",
        translation: "Bonjour",
        language: "en",
        targetLanguage: "fr"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Good evening",
        translation: "Bonsoir",
        language: "en",
        targetLanguage: "fr"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "How are you?",
        translation: "Comment allez-vous?",
        language: "en",
        targetLanguage: "fr"
      },
      {
        id: uuidv4(),
        type: "match",
        difficulty: 1,
        points: 10,
        pairs: [
          { term: "please", match: "s'il vous plaît" },
          { term: "thank you", match: "merci" },
          { term: "excuse me", match: "excusez-moi" }
        ],
        language: "en"
      }
    ]
  },
  {
    id: "spanish-verbs",
    name: "Spanish Common Verbs",
    description: "Practice common Spanish verbs and their conjugations",
    creator: "System",
    language: "en",
    targetLanguage: "es",
    difficulty: 2,
    minPlayers: 1,
    maxPlayers: 4,
    cards: [
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 2,
        points: 20,
        text: "I eat",
        translation: "Yo como",
        language: "en",
        targetLanguage: "es"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 2,
        points: 20,
        text: "You speak",
        translation: "Tú hablas",
        language: "en",
        targetLanguage: "es"
      },
      {
        id: uuidv4(),
        type: "fillblank",
        difficulty: 2,
        points: 20,
        text: "Nosotros ____ al parque. (to go)",
        blanks: [
          { index: 9, answer: "vamos" }
        ],
        language: "es"
      },
      {
        id: uuidv4(),
        type: "multiplechoice",
        difficulty: 2,
        points: 20,
        question: "Which is the correct translation of 'They are running'?",
        options: [
          "Ellos corren",
          "Ellos corriendo",
          "Ellos están corriendo",
          "Ellos son corriendo"
        ],
        correctAnswerIndex: 2,
        language: "en"
      }
    ]
  },
  {
    id: "german-basics",
    name: "German Basics",
    description: "Learn basic German words and phrases",
    creator: "System",
    language: "en",
    targetLanguage: "de",
    difficulty: 1,
    minPlayers: 1,
    maxPlayers: 4,
    cards: [
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Hello",
        translation: "Hallo",
        language: "en",
        targetLanguage: "de"
      },
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 1,
        points: 10,
        text: "Thank you",
        translation: "Danke",
        language: "en",
        targetLanguage: "de"
      },
      {
        id: uuidv4(),
        type: "match",
        difficulty: 1,
        points: 10,
        pairs: [
          { term: "yes", match: "ja" },
          { term: "no", match: "nein" },
          { term: "please", match: "bitte" }
        ],
        language: "en"
      },
      {
        id: uuidv4(),
        type: "spelling",
        difficulty: 1,
        points: 10,
        text: "Entschuldigung",
        language: "de"
      }
    ]
  },
  {
    id: "italian-food",
    name: "Italian Food Vocabulary",
    description: "Learn Italian words related to food and dining",
    creator: "System",
    language: "en",
    targetLanguage: "it",
    difficulty: 2,
    minPlayers: 1,
    maxPlayers: 4,
    cards: [
      {
        id: uuidv4(),
        type: "translation",
        difficulty: 2,
        points: 20,
        text: "Restaurant",
        translation: "Ristorante",
        language: "en",
        targetLanguage: "it"
      },
      {
        id: uuidv4(),
        type: "match",
        difficulty: 2,
        points: 20,
        pairs: [
          { term: "pasta", match: "pasta" },
          { term: "pizza", match: "pizza" },
          { term: "bread", match: "pane" },
          { term: "water", match: "acqua" }
        ],
        language: "en"
      },
      {
        id: uuidv4(),
        type: "multiplechoice",
        difficulty: 2,
        points: 20,
        question: "What is 'wine' in Italian?",
        options: ["acqua", "vino", "birra", "succo"],
        correctAnswerIndex: 1,
        language: "en"
      },
      {
        id: uuidv4(),
        type: "fillblank",
        difficulty: 2,
        points: 20,
        text: "Vorrei un ____ di vino rosso, per favore. (glass)",
        blanks: [
          { index: 9, answer: "bicchiere" }
        ],
        language: "it"
      }
    ]
  }
];
