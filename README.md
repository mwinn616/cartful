# Cartful

Meal planning, grocery list building, and recipe saving app for iOS and Android.

## Screenshots

Coming soon — app is currently in development

## Download

Coming soon to the App Store

## Tech Stack

- React Native + Expo
- TypeScript
- Spoonacular API
- AsyncStorage
- React Context API
- Expo Router

## Features

- Weekly meal planner with day-by-day recipe assignment
- Recipe search powered by the Spoonacular API with thumbnails and nutrition info
- Full recipe detail view with ingredients and step-by-step cooking instructions
- Consolidated grocery list grouped by store aisle
- Export grocery list or send to Instacart
- Personal saved meal library with multi-select delete

## Architecture

The app is built around a central `MealPlanContext` that wraps the entire 
application. This context stores the weekly meal plan and saved meal library, 
making both available to every screen via a custom `useMealPlan()` hook. 
AsyncStorage persists all data across app sessions. The three main screens — 
Plan, List, and Saved — each read from and write to this shared context, 
ensuring the grocery list and saved library always reflect the current meal plan.

## What I Learned

Cartful is my second React Native app, and the project where I focused  on understanding the codebase rather than just shipping features. 

Key concepts I developed hands-on:


- **React Context and custom hooks** — architecting shared state across multiple 
  screens using a single `MealPlanProvider` and `useMealPlan()` hook
- **AsyncStorage persistence** — storing and retrieving structured data across 
  app sessions, including converting JavaScript objects to JSON strings for 
  storage and parsing them back on retrieval
- **API integration** — working with the Spoonacular API for recipe search, 
  nutrition data, ingredients, and cooking instructions
- **Debounced search** — reducing API calls by waiting 500ms after the user 
  stops typing and ignoring queries under 2 characters
- **Data consolidation** — merging duplicate ingredients across multiple recipes 
  using `reduce()` and `Map`, then grouping by store aisle using category data 
  from the API
- **React state patterns** — immutable state updates with spread operators, 
  derived values vs stored state, and the `Set` data structure for multi-select
- **TypeScript** — typing shared data models, function signatures, and component 
  props throughout the codebase
- **The hydration pattern** — safely loading persisted data before rendering 
  any screens to prevent state being overwritten on startup

## Getting Started

1. Clone the repo
2. Run `npm install`
3. Get a free API key at [spoonacular.com/food-api](https://spoonacular.com/food-api)
4. Create a `.env` file in the project root:
5. Run `npx expo start`
6. Press `i` for iOS simulator or scan the QR code with Expo Go

## Development Notes

Built with React Native and Expo using Claude Code as an AI pair programmer 
for scaffolding and feature generation. All architecture decisions were made 
collaboratively, and I walked through every file line by line to understand 
the codebase. Several features — including the meal count derived value, delete 
confirmation alerts, and the multi-select mode on the Saved screen — were 
written independently without AI assistance.

## What's Next

- **Week navigation** — scroll between past and future weeks on the Plan screen
- **Ingredient caching** — store fetched ingredient data in AsyncStorage so 
  the List screen doesn't make repeat API calls for the same recipe, reducing 
  quota usage and improving load time
- **Ingredient sourcing** — show which recipe each ingredient comes from on the 
  List screen, with the ability to uncheck a meal and remove its ingredients 
  from the grocery list
- **Library integration** — add saved meals directly to the weekly plan from 
  the Saved screen
- **Custom recipes** — manually add your own recipes or import from other apps
- **Instacart integration** — send the full grocery list to an Instacart cart 
  with one tap, pending developer API access approval