import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
export type FilterType = "Price" | "Location" | "Area" | "Status" | null;

export interface ActiveFilters {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  status?: string;
}

export interface FilterData {
  categories: string[];
  statuses: string[];
  locations: string[];
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
}

interface FilterModalProps {
  visible: boolean;
  filterType: FilterType;
  filterData: FilterData | null;
  activeFilters: ActiveFilters;
  onClose: () => void;
  onApply: (filters: ActiveFilters) => void;
}

export default function FilterModal({
  visible,
  filterType,
  filterData,
  activeFilters,
  onClose,
  onApply,
}: FilterModalProps) {
  // Local state for the modal
  const [localFilters, setLocalFilters] = useState<ActiveFilters>({});
  const insets = useSafeAreaInsets();

  // Reset local state to match active filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(activeFilters);
    }
  }, [visible, activeFilters]);

  const handleApply = () => {
    // Validate Price
    if (
      localFilters.minPrice !== undefined &&
      localFilters.maxPrice !== undefined &&
      localFilters.minPrice >= localFilters.maxPrice
    ) {
      alert("Minimum price cannot be greater than or equal to maximum price.");
      return;
    }

    // Validate Area
    if (
      localFilters.minArea !== undefined &&
      localFilters.maxArea !== undefined &&
      localFilters.minArea >= localFilters.maxArea
    ) {
      alert("Minimum area cannot be greater than or equal to maximum area.");
      return;
    }

    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    if (filterType === "Price") {
      setLocalFilters({ ...localFilters, minPrice: undefined, maxPrice: undefined });
    } else if (filterType === "Location") {
      setLocalFilters({ ...localFilters, location: undefined });
    } else if (filterType === "Area") {
      setLocalFilters({ ...localFilters, minArea: undefined, maxArea: undefined });
    } else if (filterType === "Status") {
      setLocalFilters({ ...localFilters, status: undefined });
    }
  };

  const renderPriceFilter = () => {
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.priceHelp}>
          Enter a range between ₹{(filterData?.minPrice || 0).toLocaleString()} and ₹{(filterData?.maxPrice || 0).toLocaleString()}
        </Text>
        <View style={styles.priceInputRow}>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.priceLabel}>Min Price (₹)</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.outline}
              value={localFilters.minPrice ? String(localFilters.minPrice) : ""}
              onChangeText={(val) => setLocalFilters({ ...localFilters, minPrice: val ? Number(val) : undefined })}
            />
          </View>
          <Text style={styles.priceDash}>-</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.priceLabel}>Max Price (₹)</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              placeholder={(filterData?.maxPrice || 0).toString()}
              placeholderTextColor={Colors.outline}
              value={localFilters.maxPrice ? String(localFilters.maxPrice) : ""}
              onChangeText={(val) => setLocalFilters({ ...localFilters, maxPrice: val ? Number(val) : undefined })}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderAreaFilter = () => {
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.priceHelp}>
          Enter a range between {(filterData?.minArea || 0).toLocaleString()} and {(filterData?.maxArea || 0).toLocaleString()} sqft
        </Text>
        <View style={styles.priceInputRow}>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.priceLabel}>Min Area (sqft)</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              placeholder={(filterData?.minArea || 0).toString()}
              placeholderTextColor={Colors.outline}
              value={localFilters.minArea ? String(localFilters.minArea) : ""}
              onChangeText={(val) => setLocalFilters({ ...localFilters, minArea: val ? Number(val) : undefined })}
            />
          </View>
          <Text style={styles.priceDash}>-</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.priceLabel}>Max Area (sqft)</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              placeholder={(filterData?.maxArea || 0).toString()}
              placeholderTextColor={Colors.outline}
              value={localFilters.maxArea ? String(localFilters.maxArea) : ""}
              onChangeText={(val) => setLocalFilters({ ...localFilters, maxArea: val ? Number(val) : undefined })}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderSelectFilter = (
    options: string[] | undefined,
    currentValue: string | undefined,
    onSelect: (val: string) => void
  ) => {
    if (!options || options.length === 0) {
      return <Text style={styles.emptyText}>No options available.</Text>;
    }

    return (
      <ScrollView contentContainerStyle={styles.chipGrid}>
        {options.map((opt) => {
          const isActive = currentValue === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (filterType) {
      case "Price":
        return renderPriceFilter();
      case "Location":
        return renderSelectFilter(filterData?.locations, localFilters.location, (val) =>
          setLocalFilters({ ...localFilters, location: val })
        );
      case "Area":
        return renderAreaFilter();
      case "Status":
        return renderSelectFilter(filterData?.statuses, localFilters.status, (val) =>
          setLocalFilters({ ...localFilters, status: val })
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter by {filterType}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {renderContent()}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
    maxHeight: "80%",
    paddingBottom: 24, // Safe area padding can be added here
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  content: {
    padding: 20,
  },
  emptyText: {
    color: Colors.outline,
    textAlign: "center",
    marginTop: 20,
  },
  // Price specific styles
  priceContainer: {
    paddingVertical: 10,
  },
  priceHelp: {
    fontSize: 13,
    color: Colors.outline,
    marginBottom: 16,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  priceDash: {
    fontSize: 20,
    color: Colors.outline,
    marginHorizontal: 12,
    marginTop: 20,
  },
  // Selection Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "500",
  },
  chipTextActive: {
    color: Colors.onPrimary,
    fontWeight: "600",
  },
  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outline,
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
});
