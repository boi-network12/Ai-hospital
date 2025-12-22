// components/DiscoveryComponents/FilterSections.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

interface FilterSectionsProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

export default function FilterSections({ onFilterChange, currentFilters }: FilterSectionsProps) {
  const specializations = [
    "all",
    "general practitioner",
    "dentist",
    "dermatologist",
    "gynecologist",
    "pediatrician",
    "cardiologist",
    "neurologist",
    "orthopedic",
    "psychiatrist",
    "midwife"
  ];

  const roles = ["all", "doctor", "nurse"];
  const genders = ["all", "male", "female"];
  const availability = ["all", "available", "offline"];
  const ratings = ["all", "4.5+", "4.0+", "3.5+", "3.0+"];

  const [selectedFilters, setSelectedFilters] = useState({
    specialization: currentFilters.specialization || "",
    role: currentFilters.role || "",
    gender: currentFilters.gender || "",
    availability: currentFilters.availability || "",
    minRating: currentFilters.minRating || 0,
  });

  useEffect(() => {
    onFilterChange(selectedFilters);
  }, [selectedFilters]);

  const updateFilter = (category: string, value: string | number) => {
  setSelectedFilters(prev => ({
      ...prev,
      [category]: category === 'minRating' ? (value === 'all' ? 0 : value) : (value === 'all' ? '' : value)
    }));
  };

  const renderFilterSection = (title: string, data: string[], category: string, selectedValue: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSection}>
        {data.map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.8}
            onPress={() => updateFilter(category, item)}
            style={[
              styles.filterItem,
              (selectedValue === item || (item === 'all' && !selectedValue)) && styles.activeFilterItem,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                (selectedValue === item || (item === 'all' && !selectedValue)) && styles.activeFilterText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Filter Professionals</Text>

      <ScrollView style={styles.scrollContainer}>
        {renderFilterSection("Profession", roles, "role", selectedFilters.role)}
        {renderFilterSection("Specialization", specializations, "specialization", selectedFilters.specialization)}
        {renderFilterSection("Gender", genders, "gender", selectedFilters.gender)}
        {renderFilterSection("Availability", availability, "availability", selectedFilters.availability)}

        {/* Rating Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSection}>
            {ratings.map((rating) => (
              <TouchableOpacity
                key={rating}
                activeOpacity={0.8}
                onPress={() => updateFilter("minRating", rating === 'all' ? 0 : parseFloat(rating))}
                style={[
                  styles.filterItem,
                  (selectedFilters.minRating === (rating === 'all' ? 0 : parseFloat(rating))) && styles.activeFilterItem,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    (selectedFilters.minRating === (rating === 'all' ? 0 : parseFloat(rating))) && styles.activeFilterText,
                  ]}
                >
                  {rating === 'all' ? 'Any Rating' : `${rating} stars`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Clear Filters */}
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSelectedFilters({
            specialization: "all",
            role: "all",
            gender: "all",
            availability: "all",
            minRating: 0,
          })}
        >
          <Text style={styles.clearButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(2),
    paddingHorizontal: hp(2),
    backgroundColor: "#fff",
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: hp(2),
    fontWeight: "600",
    color: "#111",
    marginBottom: hp(2),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontWeight: "600",
    color: "#333",
    marginBottom: hp(1),
  },
  scrollSection: {
    flexGrow: 0,
  },
  filterItem: {
    backgroundColor: "#f3f4f6",
    paddingVertical: hp(1.2),
    paddingHorizontal: hp(2),
    borderRadius: hp(3),
    alignItems: "center",
    justifyContent: "center",
    marginRight: hp(1),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  activeFilterItem: {
    backgroundColor: "#8089ff22",
    borderColor: "#8089ff",
  },
  filterText: {
    fontSize: hp(1.5),
    color: "#333",
    textTransform: "capitalize",
  },
  activeFilterText: {
    color: "#4b5bfd",
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: hp(1.5),
    borderRadius: hp(1),
    alignItems: "center",
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  clearButtonText: {
    color: "#fff",
    fontSize: hp(1.6),
    fontWeight: "600",
  },
});