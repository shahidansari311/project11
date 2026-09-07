import { memo, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

const OTP_LENGTH = 6;

const OtpBoxes = memo(({ values, refs, onChange, onKeyPress, hasError }: any) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  return (
    <View style={styles.otpBoxContainer}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { refs.current[i] = ref; }}
          style={[
            styles.otpInput, 
            focusedIndex === i && styles.otpInputFocused,
            hasError && styles.otpInputError
          ]}
          maxLength={OTP_LENGTH}
          keyboardType="number-pad"
          value={values[i]}
          onChangeText={(text) => onChange(text, i)}
          onKeyPress={(e) => onKeyPress(e, i)}
          onFocus={() => {
            const firstEmptyIndex = values.findIndex((val: string) => !val);
            const targetIndex = firstEmptyIndex === -1 ? OTP_LENGTH - 1 : firstEmptyIndex;
            if (i > targetIndex) {
              refs.current[targetIndex]?.focus();
            } else {
              setFocusedIndex(i);
            }
          }}
          onBlur={() => setFocusedIndex(null)}
        />
      ))}
    </View>
  );
});

OtpBoxes.displayName = "OtpBoxes";

const styles = StyleSheet.create({
  otpBoxContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center"
  },
  otpInput: { 
    width: 46,
    height: 46, 
    textAlign: "center", 
    fontSize: 18, 
    fontWeight: "600", 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.surfaceContainerLowest, 
    color: Colors.onSurface 
  },
  otpInputFocused: {
    borderColor: "#1B4942", // Primary green color from the image
    borderWidth: 1.5,
  },
  otpInputError: { 
    borderColor: Colors.error 
  }
});

export default OtpBoxes;
