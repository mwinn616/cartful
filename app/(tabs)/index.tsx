import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useMealPlan, getWeekRange, MealSlot } from '@/context/MealPlanContext';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY ?? '';
const SEARCH_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const HERO_HEIGHT = 200;
const BACK_BTN_BG = 'rgba(26,26,26,0.5)';
// Explicitly spec'd — not in the spacing scale
const MEAL_CARD_BORDER_WIDTH = 3;

const DAY_FULL_NAMES: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

const TODAY_DATE_STR = String(new Date().getDate());

type NutrientInfo = { name: string; amount: number; unit: string };

type Recipe = {
  id: number;
  title: string;
};

type SelectedRecipe = {
  id: number;
  title: string;
  imageUrl: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type IngredientItem = {
  name: string;
  amount: { us: { value: number; unit: string } };
};

type InstructionStep = {
  number: number;
  step: string;
};

function getImageUrl(id: number): string {
  return `https://spoonacular.com/recipeImages/${id}-90x90.jpg`;
}

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(2)).toString();
}

function findNutrient(nutrients: NutrientInfo[], name: string): number {
  const n = nutrients.find(n => n.name === name);
  return n ? Math.round(n.amount) : 0;
}

export default function PlanScreen() {
  const { week: days, saveMeal, addDayMeal, removeDayMeal } = useMealPlan();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<SelectedRecipe | null>(null);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [instructions, setInstructions] = useState<InstructionStep[]>([]);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&number=10&apiKey=${API_KEY}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedRecipe) { setIngredients([]); return; }
    let cancelled = false;
    setIngredientsLoading(true);
    fetch(`https://api.spoonacular.com/recipes/${selectedRecipe.id}/ingredientWidget.json?apiKey=${API_KEY}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setIngredients(data.ingredients ?? []); })
      .catch(() => { if (!cancelled) setIngredients([]); })
      .finally(() => { if (!cancelled) setIngredientsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRecipe?.id]);

  useEffect(() => {
    if (!selectedRecipe) { setInstructions([]); return; }
    let cancelled = false;
    setInstructionsLoading(true);
    fetch(`https://api.spoonacular.com/recipes/${selectedRecipe.id}/analyzedInstructions?apiKey=${API_KEY}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setInstructions(data[0]?.steps ?? []); })
      .catch(() => { if (!cancelled) setInstructions([]); })
      .finally(() => { if (!cancelled) setInstructionsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRecipe?.id]);

  useEffect(() => {
    if (!selectedRecipe) return;
    let cancelled = false;
    setNutritionLoading(true);
    fetch(`https://api.spoonacular.com/recipes/${selectedRecipe.id}/information?includeNutrition=true&apiKey=${API_KEY}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const nutrients: NutrientInfo[] = data.nutrition?.nutrients ?? [];
          setSelectedRecipe(prev => prev ? {
            ...prev,
            calories: findNutrient(nutrients, 'Calories'),
            protein:  findNutrient(nutrients, 'Protein'),
            fat:      findNutrient(nutrients, 'Fat'),
            carbs:    findNutrient(nutrients, 'Carbohydrates'),
          } : null);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setNutritionLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRecipe?.id]);

  const openSearch = (index: number) => {
    setSelectedDayIndex(index);
    setSearchQuery('');
    setResults([]);
    setIsLoading(false);
    setImageErrors(new Set());
    setSelectedRecipe(null);
    setIngredients([]);
    setInstructions([]);
    setModalVisible(true);
  };

  const selectMeal = (title: string, id: number, imageUrl: string) => {
    if (selectedDayIndex !== null) {
      addDayMeal(selectedDayIndex, { name: title, recipeId: id, imageUrl });
      saveMeal(title, id);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setResults([]);
    setSelectedRecipe(null);
    setIngredients([]);
    setInstructions([]);
  };

  const handleResultPress = (recipe: Recipe) => {
    Keyboard.dismiss();
    setSelectedRecipe({
      id: recipe.id,
      title: recipe.title,
      imageUrl: getImageUrl(recipe.id),
      calories: 0, protein: 0, fat: 0, carbs: 0,
    });
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  const showEmptyState = !isLoading && searchQuery.trim().length >= 2 && results.length === 0;

  const dayName = selectedDayIndex !== null ? days[selectedDayIndex]?.day ?? '' : '';
  const dayFullName = selectedDayIndex !== null
    ? DAY_FULL_NAMES[days[selectedDayIndex]?.day] ?? ''
    : '';

  const getTotalMealCount = () => {
  return days.reduce((sum, d) => sum + d.meals.length, 0);
};

  const totalMeals = getTotalMealCount();

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.heading}>This Week</Text>
        <Text style={styles.subtitle}>{getWeekRange()}</Text>
        {totalMeals > 0 && 
        <Text style={styles.subtitle}>{totalMeals === 1 ? `${totalMeals} meal planned` : `${totalMeals} meals planned`}</Text>}
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {days.map((entry, index) => {
          const isToday = entry.date === TODAY_DATE_STR;
          return (
            <Card key={entry.day} style={styles.row}>
              {/* Left: day label + date */}
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{entry.day}</Text>
                {isToday ? (
                  <View style={styles.todayCircle}>
                    <Text style={styles.todayDate}>{entry.date}</Text>
                  </View>
                ) : (
                  <Text style={styles.dateNum}>{entry.date}</Text>
                )}
              </View>

              {/* Right: meal cards + add button */}
              <View style={styles.mealsRight}>
                {entry.meals.map((slot: MealSlot) => (
                  <View key={slot.id} style={styles.mealCard}>
                    <View style={styles.mealCardAccent} />
                    <Text style={styles.mealCardName} numberOfLines={1}>{slot.name}</Text>
                    <TouchableOpacity
                      style={styles.mealCardRemove}
                      onPress={() => removeDayMeal(index, slot.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close-outline" size={12} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}

                {entry.meals.length === 0 ? (
                  <TouchableOpacity style={styles.addMealPill} onPress={() => openSearch(index)}>
                    <Text style={styles.addMealPillLabel}>+ Add Meal</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => openSearch(index)}>
                    <Text style={styles.addAnotherLabel}>+ Add Another</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.dismissArea} onPress={closeModal} activeOpacity={1} />
            <View style={styles.sheet}>
              {selectedRecipe ? (
                // ── Detail view ───────────────────────────────────
                <View style={styles.detailContainer}>
                  <ScrollView
                    style={styles.detailScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.detailScrollContent}
                  >
                    <View style={styles.heroContainer}>
                      <Image
                        source={{ uri: `https://spoonacular.com/recipeImages/${selectedRecipe.id}-636x393.jpg` }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedRecipe(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="chevron-back-outline" size={20} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.recipeHeading}>{selectedRecipe.title}</Text>

                    {nutritionLoading ? (
                      <ActivityIndicator style={styles.sectionLoader} color={Colors.accent} />
                    ) : (
                      <View style={styles.nutritionRow}>
                        {[
                          { value: String(selectedRecipe.calories), label: 'cal' },
                          { value: `${selectedRecipe.protein}g`, label: 'protein' },
                          { value: `${selectedRecipe.fat}g`, label: 'fat' },
                          { value: `${selectedRecipe.carbs}g`, label: 'carbs' },
                        ].map(pill => (
                          <View key={pill.label} style={styles.pill}>
                            <Text style={styles.pillValue}>{pill.value}</Text>
                            <Text style={styles.pillLabel}>{pill.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.sectionHeader}>INGREDIENTS</Text>
                    {ingredientsLoading ? (
                      <ActivityIndicator style={styles.sectionLoader} color={Colors.accent} />
                    ) : (
                      ingredients.map((item, i) => (
                        <Text key={`${item.name}-${i}`} style={styles.ingredientItem}>
                          {formatAmount(item.amount?.us?.value ?? 0)}
                          {item.amount?.us?.unit ? ` ${item.amount.us.unit}` : ''}{' '}
                          {item.name}
                        </Text>
                      ))
                    )}

                    <Text style={[styles.sectionHeader, styles.instructionsHeader]}>
                      INSTRUCTIONS
                    </Text>
                    {instructionsLoading ? (
                      <ActivityIndicator style={styles.sectionLoader} color={Colors.accent} />
                    ) : instructions.length === 0 ? (
                      <Text style={styles.noInstructions}>
                        Instructions not available for this recipe
                      </Text>
                    ) : (
                      instructions.map(step => (
                        <View key={step.number} style={styles.stepRow}>
                          <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>{step.number}</Text>
                          </View>
                          <Text style={styles.stepText}>{step.step}</Text>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  <View style={styles.detailButtons}>
                    <Button
                      label={`Add to ${dayName}`}
                      onPress={() => selectMeal(selectedRecipe.title, selectedRecipe.id, selectedRecipe.imageUrl)}
                    />
                  </View>
                </View>
              ) : (
                // ── Search view ───────────────────────────────────
                <>
                  <View style={styles.handleBar}>
                    <View style={styles.handle} />
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Adding meal for {dayFullName}
                  </Text>
                  <View style={styles.searchContent}>
                    <TextInput
                      style={styles.input}
                      placeholder="Search recipes..."
                      placeholderTextColor={Colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                      returnKeyType="search"
                      autoCorrect={false}
                    />

                    {isLoading && <Text style={styles.statusText}>Searching...</Text>}
                    {showEmptyState && <Text style={styles.statusText}>No recipes found</Text>}

                    <FlatList
                      data={results}
                      keyExtractor={item => String(item.id)}
                      contentContainerStyle={styles.resultsList}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      style={styles.resultsFlatList}
                      renderItem={({ item }) => {
                        const imgUrl = getImageUrl(item.id);
                        const hasError = imageErrors.has(item.id);
                        return (
                          <TouchableOpacity onPress={() => handleResultPress(item)}>
                            <Card style={styles.resultRow}>
                              <View style={styles.imagePlaceholder}>
                                {hasError ? (
                                  <Ionicons name="restaurant-outline" size={24} color={Colors.textSecondary} />
                                ) : (
                                  <Image
                                    source={{ uri: imgUrl }}
                                    style={styles.recipeImage}
                                    onError={() => handleImageError(item.id)}
                                  />
                                )}
                              </View>
                              <Text style={styles.resultTitle} numberOfLines={2}>
                                {item.title}
                              </Text>
                              <Ionicons name="chevron-forward-outline" size={16} color={Colors.textSecondary} />
                            </Card>
                          </TouchableOpacity>
                        );
                      }}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  heading: {
    ...Typography.heading,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  // ── day card ────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  dayInfo: {
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: Spacing.lg,
  },
  dayName: {
    ...Typography.body,
  },
  dateNum: {
    ...Typography.caption,
  },
  todayCircle: {
    width: Spacing.lg,
    height: Spacing.lg,
    borderRadius: Radii.card,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDate: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: '700' as const,
  },
  // ── meals right column ──────────────────────────────────────
  mealsRight: {
    flex: 1,
    gap: Spacing.xs,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.button,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  mealCardAccent: {
    width: MEAL_CARD_BORDER_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: Colors.accent,
  },
  mealCardName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.xs,
  },
  mealCardRemove: {
    padding: Spacing.xs,
  },
  addMealPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  addMealPillLabel: {
    ...Typography.caption,
    color: Colors.accent,
  },
  addAnotherLabel: {
    ...Typography.caption,
    color: Colors.accent,
  },
  // ── modal shared ────────────────────────────────────────────
  kav: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    height: '80%',
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
  },
  // ── search view ─────────────────────────────────────────────
  modalSubtitle: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  searchContent: {
    flex: 1,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusText: {
    ...Typography.caption,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  resultsFlatList: {
    flex: 1,
  },
  resultsList: {
    paddingBottom: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Radii.button,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  recipeImage: {
    width: 56,
    height: 56,
  },
  resultTitle: {
    ...Typography.body,
    flex: 1,
  },
  // ── detail view ─────────────────────────────────────────────
  detailContainer: {
    flex: 1,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: Spacing.xl * 3,
  },
  heroContainer: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BACK_BTN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeHeading: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pillValue: {
    ...Typography.body,
    fontWeight: '700' as const,
  },
  pillLabel: {
    ...Typography.caption,
  },
  sectionHeader: {
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  instructionsHeader: {
    marginTop: Spacing.lg,
  },
  sectionLoader: {
    paddingVertical: Spacing.lg,
  },
  ingredientItem: {
    ...Typography.body,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumber: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: '700' as const,
  },
  stepText: {
    ...Typography.body,
    flex: 1,
  },
  noInstructions: {
    ...Typography.caption,
    paddingVertical: Spacing.sm,
  },
  detailButtons: {
    paddingTop: Spacing.md,
  },
});
