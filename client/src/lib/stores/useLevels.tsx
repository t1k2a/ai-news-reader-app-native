import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Level } from '../../types';
import { defaultLevels } from '../../data/defaultLevels';
import { v4 as uuidv4 } from 'uuid';

interface LevelsState {
  levels: Level[];
  addLevel: (level: Level) => void;
  updateLevel: (level: Level) => void;
  removeLevel: (levelId: string) => void;
  getLevelById: (levelId: string) => Level | undefined;
  shareLevel: (levelId: string) => string;
  importLevel: (levelData: string) => boolean;
  resetToDefaults: () => void;
}

// Create unique copies of the default levels to avoid sharing references
const getDefaultLevelsCopy = () => 
  defaultLevels.map(level => ({
    ...level,
    id: level.id || uuidv4(), // Ensure all levels have unique IDs
    isDefault: true,
  }));

export const useLevels = create<LevelsState>()(
  persist(
    (set, get) => ({
      levels: getDefaultLevelsCopy(),
      
      addLevel: (level: Level) => {
        set((state) => ({
          levels: [...state.levels, level],
        }));
      },
      
      updateLevel: (level: Level) => {
        set((state) => ({
          levels: state.levels.map((l) => 
            l.id === level.id ? level : l
          ),
        }));
      },
      
      removeLevel: (levelId: string) => {
        set((state) => ({
          levels: state.levels.filter((level) => 
            level.id !== levelId || level.isDefault === true
          ),
        }));
      },
      
      getLevelById: (levelId: string) => {
        return get().levels.find((level) => level.id === levelId);
      },
      
      shareLevel: (levelId: string) => {
        const level = get().levels.find((l) => l.id === levelId);
        if (!level) return '';
        
        // Create a copy without the isDefault property
        const sharableLevel = { ...level };
        delete (sharableLevel as any).isDefault;
        
        // Convert to Base64 for easier sharing
        return btoa(JSON.stringify(sharableLevel));
      },
      
      importLevel: (levelData: string) => {
        try {
          // Decode the level data
          const decodedData = atob(levelData);
          const importedLevel = JSON.parse(decodedData) as Level;
          
          // Validate the level has required properties
          if (!importedLevel.name || !importedLevel.cards || !Array.isArray(importedLevel.cards)) {
            return false;
          }
          
          // Give it a new ID to avoid conflicts
          importedLevel.id = uuidv4();
          
          // Add the imported level
          get().addLevel(importedLevel);
          return true;
        } catch (error) {
          console.error('Failed to import level:', error);
          return false;
        }
      },
      
      resetToDefaults: () => {
        set({
          levels: getDefaultLevelsCopy(),
        });
      },
    }),
    {
      name: 'lingua-play-levels',
    }
  )
);
