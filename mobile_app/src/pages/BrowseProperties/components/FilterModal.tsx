import { useState, useEffect } from "react";
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
import { useDebounce } from "../../../hooks/useDebounce";
import { propertyService } from "../../../services/property.service";

export type FilterType = "Price" | "Location" | "Area" | "Status" | null;

export interface ActiveFilters {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  location?: string[];
  status?: string[];
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
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const debouncedLocationQuery = useDebounce(locationSearchQuery, 300);
  const insets = useSafeAreaInsets();

  // Reset local state to match active filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(activeFilters);
      setLocationSearchQuery("");
      setLocationSuggestions([]);
    }
  }, [visible, activeFilters]);

  // Fetch location suggestions
  useEffect(() => {
    if (!debouncedLocationQuery || debouncedLocationQuery.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    let ignore = false;
    const fetchSuggestions = async () => {
      try {
        const res = await propertyService.getLocationSuggestions(debouncedLocationQuery);
        if (!ignore && res?.data) {
          setLocationSuggestions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch location suggestions", err);
      }
    };
    fetchSuggestions();
    return () => { ignore = true; };
  }, [debouncedLocationQuery]);

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
      setLocationSearchQuery("");
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
    currentValues: string[] | undefined,
    onToggle: (val: string) => void
  ) => {
    if (!options || options.length === 0) {
      return <Text style={styles.emptyText}>No options available.</Text>;
    }

    return (
      <View style={styles.chipGrid}>
        {options.map((opt) => {
          const isActive = currentValues?.includes(opt) || false;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onToggle(opt)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderLocationFilter = () => {
    const popularLocations = filterData?.locations || [];
    
    // Check if the searched location is already in popular locations
    const isSearchInPopular = popularLocations.some(
      loc => loc.toLowerCase() === locationSearchQuery.trim().toLowerCase()
    );
    
    const handleAddCustomLocation = () => {
      const val = locationSearchQuery.trim();
      if (!val) return;
      
      const prev = localFilters.location || [];
      if (!prev.includes(val)) {
        setLocalFilters({ ...localFilters, location: [...prev, val] });
      }
      setLocationSearchQuery("");
    };

    const toggleLocation = (val: string) => {
      const prev = localFilters.location || [];
      setLocalFilters({
        ...localFilters,
        location: prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
      });
    };

    return (
      <View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search and add locations..."
            placeholderTextColor={Colors.outline}
            value={locationSearchQuery}
            onChangeText={setLocationSearchQuery}
            onSubmitEditing={handleAddCustomLocation}
            returnKeyType="done"
          />
          {locationSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setLocationSearchQuery("")} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        {locationSuggestions.length > 0 && locationSearchQuery.trim().length >= 2 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { fontSize: 13, marginBottom: 8 }]}>Suggestions</Text>
            <View style={[styles.chipGrid, { paddingVertical: 0 }]}>
              {locationSuggestions.filter(s => !popularLocations.includes(s) && s.toLowerCase() !== locationSearchQuery.trim().toLowerCase()).map(suggestion => {
                const isActive = localFilters.location?.includes(suggestion) || false;
                return (
                  <TouchableOpacity
                    key={suggestion}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => {
                      toggleLocation(suggestion);
                      setLocationSearchQuery("");
                    }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Show custom typed location if not empty and not in popular */}
        {locationSearchQuery.trim().length > 0 && !isSearchInPopular && (
          <TouchableOpacity
            style={[styles.chip, styles.chipActive, { alignSelf: 'flex-start', marginBottom: 16, borderStyle: 'dashed' }]}
            onPress={handleAddCustomLocation}
          >
            <Text style={styles.chipTextActive}>
              + Add "{locationSearchQuery.trim()}"
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Popular Locations</Text>
        
        {/* Render popular locations AND any selected custom locations */}
        <View style={[styles.chipGrid, { paddingHorizontal: 0 }]}>
          {/* Custom locations that are selected but not in popular list */}
          {(localFilters.location || []).filter(loc => !popularLocations.includes(loc)).map((opt) => (
             <TouchableOpacity
               key={opt}
               style={[styles.chip, styles.chipActive]}
               onPress={() => toggleLocation(opt)}
             >
               <Text style={[styles.chipText, styles.chipTextActive]}>
                 {opt}
               </Text>
             </TouchableOpacity>
          ))}
          
          {/* Popular locations */}
          {popularLocations.map((opt) => {
            const isActive = localFilters.location?.includes(opt) || false;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggleLocation(opt)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {opt.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (filterType) {
      case "Price":
        return renderPriceFilter();
      case "Location":
        return renderLocationFilter();
      case "Area":
        return renderAreaFilter();
      case "Status":
        return renderSelectFilter(filterData?.statuses, localFilters.status, (val) => {
          const prev = localFilters.status || [];
          setLocalFilters({
            ...localFilters,
            status: prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
          });
        });
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
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {renderContent()}
          </ScrollView>

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
    maxHeight: "90%", // Allow more room when keyboard is open
    flexShrink: 1, // Let it shrink when keyboard is up
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 1,
  },
  emptyText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.onSurface,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 12,
  },
  // Price specific styles
  priceContainer: {
    paddingVertical: 10,
  },
  priceHelp: {
    fontSize: 12,
    color: Colors.outline,
    marginBottom: 10,
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
    fontSize: 11,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  priceDash: {
    fontSize: 14,
    color: Colors.outline,
    marginHorizontal: 8,
    marginTop: 18,
  },
  // Selection Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 11,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outline,
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
});
