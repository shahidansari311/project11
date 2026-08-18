import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, Platform } from "react-native";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

export interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  mimeType: string;
}

interface ImageUploadBoxProps {
  label: string;
  file: DocumentFile | null;
  onSelect: (file: DocumentFile) => void;
  error?: string | null;
  onView?: () => void;
}

export default function ImageUploadBox({ label, file, onSelect, error, onView }: ImageUploadBoxProps) {
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/heic", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onSelect({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType?.startsWith("image/") ? "image" : "pdf",
          mimeType: asset.mimeType || "application/octet-stream",
        });
      }
    } catch (err) {
      console.log("DocumentPicker Error:", err);
    }
  };

  const handleView = () => {
    if (file?.uri) {
      // In a real app with proper PDF support, you might use expo-web-browser or a PDF viewer
      // For images, we could show a full-screen modal, but for now we'll just open the URI.
      // Remote URIs can be opened in the browser. Local ones are harder.
      if (file.uri.startsWith("http")) {
        Linking.openURL(file.uri);
      } else {
        // Just a simple placeholder for viewing local files if needed
        alert("File selected: " + file.name);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={[styles.box, error ? styles.boxError : null]} 
        onPress={handleUpload}
        activeOpacity={0.7}
      >
        {file ? (
          <View style={styles.content}>
            {file.type === "image" || file.mimeType.startsWith("image/") ? (
              <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text" size={32} color={Colors.primary} />
                <Text style={styles.pdfText} numberOfLines={1}>{file.name}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <Ionicons name="cloud-upload-outline" size={32} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>Tap Upload to select file</Text>
            <Text style={styles.supportedText}>Supported: JPG, PNG, HEIC, PDF</Text>
          </View>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {file && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={onView || handleView}>
            <Ionicons name="eye-outline" size={18} color={Colors.primary} />
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 8,
  },
  box: {
    height: 140,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  boxError: {
    borderColor: Colors.error,
    borderStyle: "solid",
  },
  content: {
    width: "100%",
    height: "100%",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  pdfPreview: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryFixed + "30", // slightly transparent
    padding: 16,
  },
  pdfText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.onSurface,
    textAlign: "center",
  },
  emptyContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  supportedText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.outline,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: {
    color: Colors.surfaceContainerLowest,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  viewButton: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
});
