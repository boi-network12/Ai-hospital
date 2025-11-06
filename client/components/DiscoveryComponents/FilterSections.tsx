import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function FilterSections() {
  const _sectionSelects = [
    "all",
    "male",
    "female",
    "dentist",
    "nurse",
    "dermatologist",
    "gynecologist",
  ];

  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);

  const toggleFilter = (item: string) => {
    if (item === "all") {
      setSelectedFilters(["all"]);
    } else {
      let updatedFilters = selectedFilters.includes("all") ? [] : [...selectedFilters];

      if (updatedFilters.includes(item)) {
        updatedFilters = updatedFilters.filter((f) => f !== item);
      } else {
        updatedFilters.push(item);
      }

      setSelectedFilters(updatedFilters);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Filter Professionals</Text>

      <FlatList
        data={_sectionSelects}
        numColumns={2}
        scrollEnabled={false}
        keyExtractor={(item) => item}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => {
          const isSelected = selectedFilters.includes(item);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleFilter(item)}
              style={[
                styles.filterItem,
                isSelected && styles.activeFilterItem,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: hp(2) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(2),
    paddingHorizontal: hp(2),
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: hp(2),
    fontWeight: "600",
    color: "#111",
    marginBottom: hp(2),
  },
  filterItem: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: hp(1.5),
    marginBottom: hp(1.5),
    borderRadius: hp(3),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: hp(0.5),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  activeFilterItem: {
    backgroundColor: "#8089ff22",
    borderColor: "#8089ff",
  },
  filterText: {
    fontSize: hp(1.7),
    color: "#333",
    textTransform: "capitalize",
  },
  activeFilterText: {
    color: "#4b5bfd",
    fontWeight: "600",
  },
});
