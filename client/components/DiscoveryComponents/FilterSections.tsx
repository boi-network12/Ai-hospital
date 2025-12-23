// components/DiscoveryComponents/FilterSections.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Types for our filters
export interface ProfessionalFilters {
  role: 'doctor' | 'nurse' | undefined;
  specialization: string | undefined;
  gender: 'male' | 'female' | undefined;
  availability: boolean | undefined;
  minRating: number;
}

interface FilterSectionsProps {
  onFilterChange: (filters: ProfessionalFilters) => void;
  currentFilters: ProfessionalFilters;
}

// Constants for filter options (same as before)
const ROLES = [
  { id: undefined, label: 'All Roles' },
  { id: 'doctor', label: 'Doctors' },
  { id: 'nurse', label: 'Nurses' },
] as const;

const SPECIALIZATIONS = [
  { id: undefined, label: 'All Specialties' },
  { id: 'general practitioner', label: 'General Practitioner' },
  { id: 'dentist', label: 'Dentist' },
  { id: 'dermatologist', label: 'Dermatologist' },
  { id: 'gynecologist', label: 'Gynecologist' },
  { id: 'pediatrician', label: 'Pediatrician' },
  { id: 'cardiologist', label: 'Cardiologist' },
  { id: 'neurologist', label: 'Neurologist' },
  { id: 'orthopedic', label: 'Orthopedic' },
  { id: 'psychiatrist', label: 'Psychiatrist' },
  { id: 'midwife', label: 'Midwife' },
] as const;

const GENDERS = [
  { id: undefined, label: 'All Genders' },
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
] as const;

const AVAILABILITY_OPTIONS = [
  { id: undefined, label: 'Any Status', color: '#6B7280' },
  { id: true, label: 'Available Now', color: '#10B981' },
  { id: false, label: 'Currently Offline', color: '#EF4444' },
] as const;

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 1, label: '1+ Star' },
  { value: 2, label: '2+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
] as const;

// Default filter values
const DEFAULT_FILTERS: ProfessionalFilters = {
  role: undefined,
  specialization: undefined,
  gender: undefined,
  availability: undefined,
  minRating: 0,
};

export default function FilterSections({ onFilterChange, currentFilters }: FilterSectionsProps) {
  // Initialize with current filters or defaults
  const [filters, setFilters] = useState<ProfessionalFilters>(
    Object.keys(currentFilters).length > 0 ? currentFilters : DEFAULT_FILTERS
  );

  // Sync with currentFilters when they change from parent
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Update parent when filters change - use a debounce approach
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300); // Debounce to prevent rapid updates

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  // Update a single filter value
  const updateFilter = (filterName: keyof ProfessionalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Reset all filters to defaults
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  };

  // Check if a filter is currently selected
  const isSelected = (filterName: keyof ProfessionalFilters, value: any) => {
    return filters[filterName] === value;
  };

  // Check if any filter is active (not default)
  const hasActiveFilters = () => {
    return (
      filters.role !== DEFAULT_FILTERS.role ||
      filters.specialization !== DEFAULT_FILTERS.specialization ||
      filters.gender !== DEFAULT_FILTERS.gender ||
      filters.availability !== DEFAULT_FILTERS.availability ||
      filters.minRating !== DEFAULT_FILTERS.minRating
    );
  };

  // Render a section of filter buttons
  const renderFilterButtons = (
    title: string,
    options: readonly { id: any; label: string; color?: string }[],
    filterKey: keyof ProfessionalFilters
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.buttonsContainer}
      >
        {options.map((option) => {
          const isActive = isSelected(filterKey, option.id);
          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
                option.color && !isActive && { borderColor: option.color }
              ]}
              onPress={() => updateFilter(filterKey, option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.buttonText,
                isActive && styles.buttonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Custom rating selector component
  const RatingSelector = () => {
    const handleRatingSelect = (ratingValue: number) => {
      updateFilter('minRating', ratingValue);
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minimum Rating</Text>
        <View style={styles.ratingContainer}>
          {RATING_OPTIONS.map((option) => {
            const isActive = filters.minRating === option.value;
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingButton,
                  isActive && styles.ratingButtonActive
                ]}
                onPress={() => handleRatingSelect(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.ratingText,
                  isActive && styles.ratingTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filter Professionals</Text>
        {hasActiveFilters() && (
          <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Role Filter */}
        {renderFilterButtons('Profession', ROLES, 'role')}

        {/* Specialization Filter */}
        {renderFilterButtons('Specialization', SPECIALIZATIONS, 'specialization')}

        {/* Gender Filter */}
        {renderFilterButtons('Gender', GENDERS, 'gender')}

        {/* Availability Filter */}
        {renderFilterButtons('Availability', AVAILABILITY_OPTIONS, 'availability')}

        {/* Rating Filter - Custom Component */}
        <RatingSelector />

        {/* Clear All Button */}
        {hasActiveFilters() && (
          <TouchableOpacity 
            style={styles.clearAllButton} 
            onPress={resetFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.clearAllText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: hp(2),
    paddingTop: hp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: '#111827',
  },
  resetButton: {
    paddingHorizontal: hp(1.5),
    paddingVertical: hp(0.5),
    backgroundColor: '#F3F4F6',
    borderRadius: hp(1),
  },
  resetText: {
    fontSize: hp(1.4),
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: hp(2.5),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp(1),
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderRadius: hp(1.5),
    marginRight: hp(1),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  buttonText: {
    fontSize: hp(1.4),
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
  },
  ratingButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: hp(1.5),
    paddingVertical: hp(1),
    borderRadius: hp(1.5),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ratingButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  ratingText: {
    fontSize: hp(1.4),
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  clearAllButton: {
    backgroundColor: '#EF4444',
    paddingVertical: hp(1.8),
    borderRadius: hp(1.5),
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(4),
  },
  clearAllText: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
});