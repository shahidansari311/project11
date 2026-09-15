import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

let showGlobalAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;

export const GlobalAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    if (showGlobalAlert) {
      showGlobalAlert(title, message, buttons, options);
    } else {
      console.warn("GlobalAlertModal is not mounted.");
    }
  }
};

export default function GlobalAlertModal() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const [options, setOptions] = useState<AlertOptions | undefined>();

  useEffect(() => {
    showGlobalAlert = (t, m, b, o) => {
      setTitle(t);
      setMessage(m);
      setButtons(b && b.length > 0 ? b : [{ text: 'OK', onPress: () => {} }]);
      setOptions(o);
      setVisible(true);
    };
  }, []);

  const handleClose = () => {
    if (options?.cancelable === false) return;
    setVisible(false);
    if (options?.onDismiss) options.onDismiss();
  };

  const handleButtonPress = (onPress?: () => void) => {
    setVisible(false);
    if (onPress) onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          
          <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonColumn]}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length > 2 && styles.buttonColumnItem,
                    isDestructive ? styles.destructiveButton : (isCancel ? styles.cancelButton : styles.primaryButton)
                  ]}
                  onPress={() => handleButtonPress(btn.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    isDestructive ? styles.destructiveText : (isCancel ? styles.cancelText : styles.primaryText)
                  ]}>
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonColumn: {
    flexDirection: "column",
  },
  buttonColumnItem: {
    flex: 0,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  destructiveButton: {
    backgroundColor: Colors.error,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onError,
  },
});
