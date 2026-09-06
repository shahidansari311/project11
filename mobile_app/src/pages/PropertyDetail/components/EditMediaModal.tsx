import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";
import api from "../../../utils/api";
import { Property } from "../../BrowseProperties/data";
import { youtubeUrlSchema } from "@/utils/validationSchemas";

interface EditMediaModalProps {
  visible: boolean;
  onClose: () => void;
  property: Property;
  onUpdate: () => void;
}

export default function EditMediaModal({ visible, onClose, property, onUpdate }: EditMediaModalProps) {
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(property.youtubeVideoUrl || "");
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const [videoUrlError, setVideoUrlError] = useState("");

  const handleUpdateVideo = async () => {
    if (youtubeVideoUrl) {
      const result = youtubeUrlSchema.safeParse(youtubeVideoUrl);
      if (!result.success) {
        setVideoUrlError(result.error.issues[0].message);
        return;
      }
    }

    setIsUpdatingVideo(true);
    try {
      await api.patch(`/builder/property/builder/${property.id}`, { youtubeVideoUrl });
      Alert.alert("Success", "Video link updated successfully");
      onUpdate();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update video link");
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  const handleAddImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) return;

      for (const asset of result.assets) {
        if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
          Alert.alert("File Too Large", "One or more images exceed the 2MB limit. Please select smaller images.");
          return;
        }
      }

      setIsUploadingImage(true);
      const formData = new FormData();
      result.assets.forEach((asset, index) => {
        const fileExtension = asset.uri.split(".").pop() || "jpg";
        formData.append("images", {
          uri: asset.uri,
          name: asset.fileName || `upload_${index}.${fileExtension}`,
          type: asset.mimeType || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        } as any);
      });

      await api.patch(`/builder/property/builder/${property.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Images uploaded successfully");
      onUpdate();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to upload images");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = (imageUrl: string) => {
    Alert.alert("Delete Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingImage(imageUrl);
          try {
            await api.delete(`/builder/property/builder/${property.id}/image`, {
              data: { imageUrl },
            });
            Alert.alert("Success", "Image removed");
            onUpdate();
          } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to remove image");
          } finally {
            setDeletingImage(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Property Media</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Video Section */}
            <Text style={styles.sectionTitle}>YOUTUBE VIDEO LINK</Text>
            <View style={styles.videoRow}>
              <TextInput
                style={[styles.input, videoUrlError ? { borderColor: Colors.error } : null]}
                value={youtubeVideoUrl}
                onChangeText={(val) => {
                  setYoutubeVideoUrl(val);
                  if (videoUrlError) setVideoUrlError("");
                }}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveBtn, isUpdatingVideo && styles.disabledBtn]}
                onPress={handleUpdateVideo}
                disabled={isUpdatingVideo || youtubeVideoUrl === (property.youtubeVideoUrl || "")}
              >
                {isUpdatingVideo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            {videoUrlError ? <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{videoUrlError}</Text> : null}

            {/* Images Section */}
            <View style={styles.imageHeaderRow}>
              <Text style={styles.sectionTitle}>PROPERTY IMAGES</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddImage} disabled={isUploadingImage}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Add Photos</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.imagesGrid}>
              {property.images?.map((img, index) => (
                <View key={index} style={styles.imageBox}>
                  <Image source={{ uri: img }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleDeleteImage(img)}
                    disabled={deletingImage === img}
                  >
                    {deletingImage === img ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="trash" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
              {(!property.images || property.images.length === 0) && (
                <Text style={styles.emptyText}>No images uploaded yet.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  scrollArea: {},
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  videoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.onSurface,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  imageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageBox: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  deleteIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(239, 68, 68, 0.9)", // red-500
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
    width: "100%",
    textAlign: "center",
  },
});
