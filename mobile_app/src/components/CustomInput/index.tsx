import React, { memo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

const CustomInput = memo(({ label, value, onChange, error, placeholder, keyboardType, autoCapitalize, maxLength, disabled }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={[styles.inputLabel, disabled && styles.disabledOpacity]}>{label}</Text>
    <View style={[
      styles.inputFieldContainer, 
      error ? styles.inputFieldError : (disabled ? styles.inputFieldDisabled : styles.inputFieldDefault), 
      disabled && styles.disabledOpacity
    ]}>
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
      />
    </View>
    {error && !disabled ? (
      <Text style={styles.errorText}>{error}</Text>
    ) : null}
  </View>
));

CustomInput.displayName = "CustomInput";

const styles = StyleSheet.create({
  inputWrapper: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: "500", color: Colors.onSurface, marginBottom: 8, letterSpacing: 0.24 },
  inputFieldContainer: { flexDirection: "row", alignItems: "center", height: 48, borderBottomWidth: 1 },
  inputFieldDefault: { borderBottomColor: Colors.border },
  inputFieldError: { borderBottomColor: Colors.error },
  inputFieldDisabled: { borderBottomColor: "transparent" },
  inputText: { flex: 1, fontSize: 16, color: Colors.onSurface, fontWeight: "500" },
  disabledOpacity: { opacity: 0.6 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 6, lineHeight: 16 },
});

export default CustomInput;
