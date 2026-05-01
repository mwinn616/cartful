import React, {useState} from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useMealPlan } from '@/context/MealPlanContext';
import { Colors, Typography, Spacing } from '@/constants/theme';

function formatSavedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SavedScreen() {
  const { savedMeals, removeMeal } = useMealPlan();

const [inSelectMode, setInSelectMode] = useState(false) 
const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

const toggleSelectMode = () => {
  setInSelectMode(!inSelectMode);
  setCheckedIds(new Set());
};

 const toggleMealCheck = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

const deleteSelectedMeals = () => {
  Alert.alert(
    'Delete selected meals?',
    'This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        checkedIds.forEach(id => removeMeal(id));
        setCheckedIds(new Set());
        setInSelectMode(false);
      } },
    ]
  );
}

  return (
    <ScreenWrapper>
      <View style={styles.header}>
  <View style={styles.headerRow}>
    <Text style={styles.heading}>Saved Meals</Text>
    {savedMeals.length > 0 && (
      <TouchableOpacity onPress={toggleSelectMode}>
        <Text style={styles.selectButton}>
          {inSelectMode ? 'Cancel' : 'Select'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
  {savedMeals.length > 0 && (
    <Text style={styles.subtitle}>
      {savedMeals.length} {savedMeals.length === 1 ? 'recipe' : 'recipes'}
    </Text>
  )}
</View>

      {savedMeals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No saved meals yet</Text>
          <Text style={styles.emptyBody}>
            Meals you add to your plan will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {savedMeals.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={styles.cardWrapper}
              onPress={() => inSelectMode ? toggleMealCheck(item.id) : Alert.alert('Add to week coming soon')}
            >
              <Card style={styles.mealRow}>
               {inSelectMode && (
                  <Ionicons
                    name={checkedIds.has(item.id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={Colors.accent}
                  />
                )}
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.savedAt}>Added {formatSavedDate(item.savedAt)}</Text>
                </View>
                {!inSelectMode && (
                <TouchableOpacity
                onPress={() => Alert.alert('Are you sure you want to remove this meal?', 'This action cannot be undone', [
                  { text: 'Delete Meal', style: 'destructive', onPress: () => removeMeal(item.id) },
                  { text: 'Cancel', style: 'cancel' }
                ])}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {inSelectMode && checkedIds.size > 0 && (
              <View style={styles.footer}>
                <Button label="Delete" onPress={deleteSelectedMeals} />
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
  headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
selectButton: {
  ...Typography.body,
  color: Colors.accent,
},
  subtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyBody: {
    ...Typography.caption,
    textAlign: 'center',
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  cardWrapper: {
    marginBottom: Spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: {
    flex: 1,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  mealName: {
    ...Typography.body,
  },
  savedAt: {
    ...Typography.caption,
  },
    footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  }
});
