import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import api from "@/utils/api";
import { authService, UserProfile } from "@/services/auth.service";
import { useToast } from "@/components/Toast";
import ImageViewing from "react-native-image-viewing";

import UserDetailsCard from "./components/UserDetailsCard";
import DocumentTypeSelector, { DocumentType } from "./components/DocumentTypeSelector";
import ImageUploadBox, { DocumentFile } from "./components/ImageUploadBox";
import DocumentStatusTracker from "./components/DocumentStatusTracker";
import Skeleton from "@/components/ui/Skeleton";
import { Ionicons } from "@expo/vector-icons";

// LayoutAnimation works natively in New Architecture.

export default function DocumentUploadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("AADHAAR");

  // Independent States for new uploads
  const [aadharFrontImage, setAadharFrontImage] = useState<DocumentFile | null>(null);
  const [aadharBackImage, setAadharBackImage] = useState<DocumentFile | null>(null);
  const [panFrontImage, setPanFrontImage] = useState<DocumentFile | null>(null);

  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing Documents State
  const [panDoc, setPanDoc] = useState<any>(null);
  const [aadharDoc, setAadharDoc] = useState<any>(null);

  // Image Viewer State
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const profileResponse = await authService.getProfile();
      if (profileResponse.data) {
        setProfile(profileResponse.data);
      }

      const docResponse = await api.get("/user/document");
      if (docResponse.data?.data) {
        const docs = docResponse.data.data;
        
        // Find documents in the array returned by backend
        const pan = docs.find((d: any) => d.documentType === "PAN");
        const aadhar = docs.find((d: any) => d.documentType === "AADHAAR");
        
        setPanDoc(pan || null);
        setAadharDoc(aadhar || null);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDocumentType(type);
    setFrontError(null);
    setBackError(null);
  };

  const openImageViewer = (file: DocumentFile) => {
    if (file.mimeType === "application/pdf" || file.type === "pdf") {
      showToast("PDF preview is not supported yet.");
      return;
    }
    setViewerImages([{ uri: file.uri }]);
    setIsViewerVisible(true);
  };

  const handleViewExisting = (docType: string) => {
    if (docType === "PAN") {
      if (panDoc?.documentUrl) {
        setViewerImages([{ uri: panDoc.documentUrl }]);
        setIsViewerVisible(true);
      }
    } else if (docType === "AADHAAR") {
      const images = [];
      if (aadharDoc?.frontImageUrl) images.push({ uri: aadharDoc.frontImageUrl });
      if (aadharDoc?.backImageUrl) images.push({ uri: aadharDoc.backImageUrl });
      if (images.length === 0 && aadharDoc?.documentUrl) images.push({ uri: aadharDoc.documentUrl });

      if (images.length > 0) {
        setViewerImages(images);
        setIsViewerVisible(true);
      }
    }
  };

  const handleSubmit = async () => {
    let isValid = true;
    setFrontError(null);
    setBackError(null);

    const frontImage = documentType === "AADHAAR" ? aadharFrontImage : panFrontImage;
    const backImage = documentType === "AADHAAR" ? aadharBackImage : null;

    if (!frontImage) {
      setFrontError("Please upload the front image.");
      isValid = false;
    }

    if (documentType === "AADHAAR" && !backImage) {
      setBackError("Please upload the back image of your Aadhar Card.");
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      if (documentType === "PAN") {
        const formData = new FormData();
        formData.append("documentType", "PAN");
        formData.append("file", {
          uri: frontImage!.uri,
          name: frontImage!.name,
          type: frontImage!.mimeType,
        } as any);

        await api.post("/user/document", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPanFrontImage(null);
      } else {
        const formData = new FormData();
        formData.append("documentType", "AADHAAR");
        formData.append("frontImage", {
          uri: frontImage!.uri,
          name: frontImage!.name,
          type: frontImage!.mimeType,
        } as any);
        formData.append("backImage", {
          uri: backImage!.uri,
          name: backImage!.name,
          type: backImage!.mimeType,
        } as any);

        await api.post("/user/document", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setAadharFrontImage(null);
        setAadharBackImage(null);
      }
      
      showToast("Your documents have been submitted for review.");

      // Auto-toggle to the other document type
      handleDocumentTypeChange(documentType === "PAN" ? "AADHAAR" : "PAN");

      // Refresh status
      await fetchData();
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMsg = "Upload Failed. Something went wrong.";

      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData);
          errorMsg = parsed.message || errorMsg;
        } catch (e) {
          errorMsg = responseData;
        }
      } else if (responseData?.message) {
        errorMsg = responseData.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAadharStatus = () => {
    return aadharDoc?.status || "PENDING";
  };

  const getAadharRemark = () => {
    return aadharDoc?.remark || null;
  };

  const aadharStatus = aadharDoc ? getAadharStatus() : null;
  const aadharRemark = aadharDoc ? getAadharRemark() : null;

  const panStatus = panDoc?.status || null;
  const panRemark = panDoc?.remark || null;

  const isFormValid = documentType === "AADHAAR"
    ? (aadharFrontImage !== null && aadharBackImage !== null)
    : (panFrontImage !== null);

  const isAadharUploadHidden = aadharStatus === "PENDING" || aadharStatus === "APPROVED";
  const isPanUploadHidden = panStatus === "PENDING" || panStatus === "APPROVED";

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={120} height={24} />
            <View style={{ width: 32 }} />
          </View>

          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 24 }} />

          <View style={styles.formSection}>
            <Skeleton width="100%" height={48} borderRadius={24} style={{ marginBottom: 24 }} />

            <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 24 }} />

            <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={160} borderRadius={16} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload KYC</Text>
        <View style={{ width: 24 }} />
      </View>

      <UserDetailsCard user={profile} />

      <View style={styles.formSection}>
        <DocumentTypeSelector value={documentType} onChange={handleDocumentTypeChange} />

        {documentType === "AADHAAR" ? (
          <>
            {isAadharUploadHidden ? (
              <DocumentStatusTracker status={aadharStatus} documentName="Aadhar Card" onView={() => handleViewExisting("AADHAAR")} />
            ) : (
              <>
                {(aadharStatus === "REJECTED" || aadharStatus === "REUPLOAD_REQUIRED") && (
                  <DocumentStatusTracker status="REJECTED" remark={aadharRemark} documentName="Aadhar Card" onView={() => handleViewExisting("AADHAAR")} />
                )}
                <ImageUploadBox
                  label="Front of Aadhar Card"
                  file={aadharFrontImage}
                  onSelect={(file) => {
                    setAadharFrontImage(file);
                    setFrontError(null);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  error={frontError}
                  onView={() => aadharFrontImage && openImageViewer(aadharFrontImage)}
                />
                <ImageUploadBox
                  label="Back of Aadhar Card"
                  file={aadharBackImage}
                  onSelect={(file) => {
                    setAadharBackImage(file);
                    setBackError(null);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  error={backError}
                  onView={() => aadharBackImage && openImageViewer(aadharBackImage)}
                />
              </>
            )}
          </>
        ) : (
          <>
            {isPanUploadHidden ? (
              <DocumentStatusTracker status={panStatus} documentName="PAN Card" onView={() => handleViewExisting("PAN")} />
            ) : (
              <>
                {(panStatus === "REJECTED" || panStatus === "REUPLOAD_REQUIRED") && (
                  <DocumentStatusTracker status="REJECTED" remark={panRemark} documentName="PAN Card" onView={() => handleViewExisting("PAN")} />
                )}
                <ImageUploadBox
                  label="Front of PAN Card"
                  file={panFrontImage}
                  onSelect={(file) => {
                    setPanFrontImage(file);
                    setFrontError(null);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  error={frontError}
                  onView={() => panFrontImage && openImageViewer(panFrontImage)}
                />
              </>
            )}
          </>
        )}
      </View>

      {/* Only show submit button if we are not in a hidden upload state */}
      {((documentType === "AADHAAR" && !isAadharUploadHidden) || (documentType === "PAN" && !isPanUploadHidden)) && (
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Uploading...</Text>
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Document</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.surfaceContainerLowest} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      )}

      <ImageViewing
        images={viewerImages}
        imageIndex={0}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: Platform.OS === "android" ? 20 : 0,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.onSurface,
  },
  formSection: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: Colors.surfaceContainerLowest,
    fontSize: 16,
    fontWeight: "bold",
  }
});
