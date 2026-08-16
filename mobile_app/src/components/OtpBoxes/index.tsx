import React, { memo } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

const OTP_LENGTH = 6;

const OtpBoxes = memo(({ values, refs, onChange, onKeyPress, hasError }: any) => (
  <View style={styles.otpBoxContainer}>
    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
      <TextInput
        key={i}
        ref={(ref) => { refs.current[i] = ref; }}
        style={[styles.otpInput, hasError && styles.otpInputError]}
        maxLength={OTP_LENGTH}
        keyboardType="number-pad"
        value={values[i]}
        onChangeText={(text) => onChange(text, i)}
        onKeyPress={(e) => onKeyPress(e, i)}
      />
    ))}
  </View>
));

OtpBoxes.displayName = "OtpBoxes";

const styles = StyleSheet.create({
  otpBoxContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    gap: 8 
  },
  otpInput: { 
    flex: 1, 
    height: 52, 
    textAlign: "center", 
    fontSize: 20, 
    fontWeight: "600", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.surfaceContainerLowest, 
    color: Colors.onSurface 
  },
  otpInputError: { 
    borderColor: Colors.error 
  }
});

export default OtpBoxes;
