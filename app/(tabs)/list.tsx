import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useMealPlan } from '@/context/MealPlanContext';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY ?? '';

type RawIngredient = {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
};

type Ingredient = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
};

type AisleGroup = {
  aisle: string;
  items: Ingredient[];
};

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat((Math.round(n * 100) / 100).toFixed(2)).toString();
}

function consolidate(raw: RawIngredient[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const item of raw) {
    const key = `${item.name.toLowerCase()}::${item.unit.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount = Math.round((existing.amount + item.amount) * 100) / 100;
    } else {
      map.set(key, { ...item, id: key });
    }
  }
  return Array.from(map.values());
}

function groupByAisle(ingredients: Ingredient[]): AisleGroup[] {
  const map = new Map<string, Ingredient[]>();
  for (const item of ingredients) {
    const aisle = item.aisle || 'Other';
    const group = map.get(aisle) ?? [];
    group.push(item);
    map.set(aisle, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([aisle, items]) => ({ aisle, items }));
}

export default function ListScreen() {
  const { week } = useMealPlan();
  const [groups, setGroups] = useState<AisleGroup[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const mealCount = week.reduce((sum, d) => sum + d.meals.length, 0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        const allMeals = week.flatMap(d => d.meals);
        if (allMeals.length === 0) {
          setGroups([]);
          return;
        }

        setIsLoading(true);
        try {
          const raw: RawIngredient[] = [];
          await Promise.all(
            allMeals.map(async slot => {
              const res = await fetch(
                `https://api.spoonacular.com/recipes/${slot.recipeId}/information?includeNutrition=false&apiKey=${API_KEY}`
              );
              const data = await res.json();
              for (const ing of (data.extendedIngredients ?? [])) {
                raw.push({
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit ?? '',
                  aisle: ing.aisle?.split(';')[0].trim() ?? 'Other',
                });
              }
            })
          );
          if (!cancelled) {
            setGroups(groupByAisle(consolidate(raw)));
            setCheckedIds(new Set());
          }
        } catch {
          if (!cancelled) setGroups([]);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [week])
  );

  const openInstacart = () => {
    Alert.alert(
      'Coming Soon',
      'Instacart integration is on the way. For now, use Export List to share your grocery list.',
      [{ text: 'Got it' }]
    );
  };

  const exportList = () => {
    const lines: string[] = ['GROCERY LIST', ''];
    for (const group of groups) {
      lines.push(group.aisle.toUpperCase());
      for (const item of group.items) {
        const amt = `${formatAmount(item.amount)}${item.unit ? ` ${item.unit}` : ''}`;
        lines.push(`• ${item.name} — ${amt}`);
      }
      lines.push('');
    }
    Share.share({ message: lines.join('\n').trimEnd() });
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.heading}>Grocery List</Text>
        {mealCount > 0 && (
          <Text style={styles.subtitle}>
            {mealCount} {mealCount === 1 ? 'meal' : 'meals'} this week
          </Text>
        )}
      </View>

      {mealCount === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Your list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add meals in the Plan tab to generate your grocery list
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {groups.map(group => (
            <View key={group.aisle} style={styles.aisleGroup}>
              <Text style={styles.aisleLabel}>{group.aisle.toUpperCase()}</Text>
              {group.items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleCheck(item.id)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.ingredientRow}>
                    <View style={[
                      styles.checkbox,
                      checkedIds.has(item.id) && styles.checkboxChecked,
                    ]}>
                      {checkedIds.has(item.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={[
                      styles.ingredientName,
                      checkedIds.has(item.id) && styles.struckThrough,
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={styles.amount}>
                      {formatAmount(item.amount)}{item.unit ? ` ${item.unit}` : ''}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {mealCount > 0 && !isLoading && (
        <View style={styles.footer}>
          <Button label="Order Groceries via Instacart" onPress={openInstacart} />
          <Button
            label="Export List"
            variant="ghost"
            onPress={exportList}
            style={styles.ghostButton}
          />
        </View>
      )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.caption,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  aisleGroup: {
    marginBottom: Spacing.lg,
  },
  aisleLabel: {
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radii.button / 2,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.background,
  },
  ingredientName: {
    ...Typography.body,
    flex: 1,
  },
  struckThrough: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  amount: {
    ...Typography.caption,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  ghostButton: {
    marginTop: Spacing.xs,
  },
});
