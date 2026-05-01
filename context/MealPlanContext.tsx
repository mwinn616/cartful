// This file defines the MealPlanContext and MealPlanProvider components, which manage the state of the meal plan and saved meals in the Cartful app. It uses AsyncStorage to persist data across app restarts and provides utility functions for working with the meal plan.

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Shared data types used across the app

export type MealSlot = {
  id: string;
  name: string;
  recipeId: number;
  imageUrl: string;
};

export type DayEntry = {
  day: string;
  date: string;
  meals: MealSlot[];
};

export type SavedMeal = {
  id: number;
  name: string;
  savedAt: string;
};

// Keys used to read/write data to AsyncStorage

const STORAGE_WEEK = 'cartful_week';
const STORAGE_WEEK_KEY = 'cartful_week_key';
const STORAGE_SAVED = 'cartful_saved';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get the Monday of the week for a given date (or today if not provided).

function getMondayOfWeek(from: Date): Date {
  const d = new Date(from);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Converts a date to a string key e.g. "2026-04-27" that can be used to determine week changes

function currentWeekKey(): string {
  return getMondayOfWeek(new Date()).toISOString().split('T')[0];
}

// Formats a date to a short display string e.g. "Apr 27"
function formatShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Builds a fresh 7-day week array starting from Monday

function buildWeek(): DayEntry[] {
  const monday = getMondayOfWeek(new Date());
  return DAY_LABELS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day, date: String(d.getDate()), meals: [] };
  });
}

// Get a human-friendly string representing the date range of the current week, e.g. "Sep 4 — Sep 10".

export function getWeekRange(): string {
  const monday = getMondayOfWeek(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${formatShort(monday)} — ${formatShort(sunday)}`;
}

// Context and provider for managing the meal plan state, including the current week's meals and saved meals.

type MealPlanContextValue = {
  week: DayEntry[];
  savedMeals: SavedMeal[];
  saveMeal: (name: string, id: number) => void;
  removeMeal: (id: number) => void;
  addDayMeal: (dayIndex: number, slot: Omit<MealSlot, 'id'>) => void;
  removeDayMeal: (dayIndex: number, mealId: string) => void;
};

// Creates the context object - null until MealPlanProvider wraps the app

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: React.ReactNode }) {

// -- State -----------------------------------------------------------------------
// Hydrated gate prevents writes before AsyncStorage read completes

  const [week, setWeek] = useState<DayEntry[]>(buildWeek);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [hydrated, setHydrated] = useState(false);

  //── hydrate state from AsyncStorage on mount ─────────────────────
  useEffect(() => {
    async function hydrate() {
      try {
        const [weekJson, weekKeyJson, savedJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_WEEK),
          AsyncStorage.getItem(STORAGE_WEEK_KEY),
          AsyncStorage.getItem(STORAGE_SAVED),
        ]);
        if (weekJson && weekKeyJson === currentWeekKey()) {
          const parsed = JSON.parse(weekJson);
          // Guard against stale data from the old single-meal-per-day shape
          if (Array.isArray(parsed) && parsed.every((d: unknown) =>
            typeof d === 'object' && d !== null && Array.isArray((d as DayEntry).meals)
          )) {
            setWeek(parsed);
          }
        }
        if (savedJson) setSavedMeals(JSON.parse(savedJson));
      } catch {
        // silent — default state already in place
      } finally {
        setHydrated(true);
      }
    }
    hydrate();
  }, []);

  // ── persist week whenever it changes ─────────────────────
  useEffect(() => {
    if (!hydrated) return;
    const key = currentWeekKey();
    AsyncStorage.setItem(STORAGE_WEEK, JSON.stringify(week)).catch(() => {});
    AsyncStorage.setItem(STORAGE_WEEK_KEY, key).catch(() => {});
  }, [week, hydrated]);

  // ── persist savedMeals whenever it changes ────────────────
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_SAVED, JSON.stringify(savedMeals)).catch(() => {});
  }, [savedMeals, hydrated]);

  // Add a meal to the saved library if it's not already there

  const saveMeal = (name: string, id: number) => {
    setSavedMeals(prev => {
      if (prev.some(m => m.id === id)) return prev;
      return [{ id, name, savedAt: new Date().toISOString() }, ...prev];
    });
  };

  // Remove a meal from the saved library

  const removeMeal = (id: number) => {
    setSavedMeals(prev => prev.filter(m => m.id !== id));
  };

  // Add a meal slot to a specific day in the week. The slot ID is generated based on the current timestamp to ensure uniqueness.

  const addDayMeal = (dayIndex: number, slot: Omit<MealSlot, 'id'>) => {
    setWeek(prev => prev.map((entry, i) => {
      if (i !== dayIndex) return entry;
      const newSlot: MealSlot = { ...slot, id: `${entry.day}-${Date.now()}` };
      return { ...entry, meals: [...entry.meals, newSlot] };
    }));
  };

  // Removes a specific meal slot from a day by meal ID.

  const removeDayMeal = (dayIndex: number, mealId: string) => {
    setWeek(prev => prev.map((entry, i) => {
      if (i !== dayIndex) return entry;
      return { ...entry, meals: entry.meals.filter(m => m.id !== mealId) };
    }));
  };

  return (
    <MealPlanContext.Provider
      value={{ week, savedMeals, saveMeal, removeMeal, addDayMeal, removeDayMeal }}
    >
      {hydrated ? children : null}
    </MealPlanContext.Provider>
  );
}

// Custom hook - call this in any screen to access meal plan state and actions
// Throws if used outside of MealPlanProvider

export function useMealPlan(): MealPlanContextValue {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan must be used within MealPlanProvider');
  return ctx;
}
