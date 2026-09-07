import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Colors } from "@/constants/colors";
import SignatureScreen from "react-native-signature-canvas";
import { signatureStore } from "../../utils/signatureStore";

export default function ViewSignAgreementPage() {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [placeOfSignature, setPlaceOfSignature] = useState("");
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [isLocating, setIsLocating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const signatureRef = useRef<any>(null);

  useEffect(() => {
    // Fetch location in advance when the page loads
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationStatus("denied");
          setIsLocating(false);
          return;
        }
        
        setLocationStatus("granted");

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (address && address.length > 0) {
          const city = address[0].city || address[0].subregion || address[0].region || "Unknown City";
          setPlaceOfSignature(city);
        }
      } catch (e) {
        console.warn("Could not fetch precise address", e);
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocation();
  }, []);

  const handleSignatureOK = (signature: string) => {
    if (!placeOfSignature.trim()) {
      alert("Location could not be determined. Please ensure location services are enabled.");
      return;
    }
    setSignatureBase64(signature);
    setShowSignatureModal(false);
  };

  const handleOpenSignature = () => {
    if (locationStatus === "denied") {
      alert('Permission to access location is required to sign the agreement.');
      return;
    }
    // If it's still fetching, it will show the loading spinner inside the modal
    setShowSignatureModal(true);
  };

  const insets = useSafeAreaInsets();
  const params = require("expo-router").useLocalSearchParams();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Agreement</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Preview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Fractional Ownership Agreement</Text>
              <Text style={styles.cardSubtitle}>Ref: FOA-XXXX-XXXX</Text>
            </View>
          </View>
          
          <ScrollView style={styles.documentBody} nestedScrollEnabled={true}>
            <Text style={styles.docHeading}>1. Parties to the Agreement</Text>
            <Text style={styles.docText}>
              This Fractional Ownership Agreement (the "Agreement") is entered into as of the date of electronic signature, by and between Silverreal Estate Management LLC ("Manager") and the undersigned investor ("Investor").
            </Text>
            
            <Text style={styles.docHeading}>2. Investment Terms</Text>
            <Text style={styles.docText}>
              The Investor agrees to purchase fractional shares in the property identified in Schedule A, subject to the terms and conditions set forth herein.
            </Text>

            <Text style={styles.docHeading}>3. Management and Operations</Text>
            <Text style={styles.docText}>
              The Manager shall have exclusive authority to manage, operate, and maintain the property.
            </Text>

            <Text style={styles.docHeading}>4. Transferability</Text>
            <Text style={styles.docText}>
              Fractional shares may be transferred or sold subject to a right of first refusal.
            </Text>

            <Text style={styles.docHeading}>5. Dispute Resolution</Text>
            <Text style={styles.docText}>
              Any disputes arising under this Agreement shall be resolved through binding arbitration.
            </Text>
          </ScrollView>
        </View>

        {/* Signature Section */}
        <View style={styles.card}>
          <Text style={styles.signatureTitle}>Digital Signature</Text>
          <Text style={styles.signatureSubtitle}>
            By signing below, you agree to the terms outlined in the document above.
          </Text>
          
          <TouchableOpacity 
            style={[styles.signaturePad, signatureBase64 && styles.signaturePadSigned]} 
            activeOpacity={0.7}
            onPress={handleOpenSignature}
          >
            {signatureBase64 ? (
              <View style={styles.signedContent}>
                <Image 
                  source={{ uri: signatureBase64 }} 
                  style={styles.signatureImagePreview} 
                  resizeMode="contain" 
                />
                <Text style={styles.signedPlaceText}>Signed at {placeOfSignature}</Text>
                <Text style={styles.tapToEdit}>Tap to redraw signature</Text>
              </View>
            ) : (
              <>
                <Text style={styles.signaturePlaceholderText}>Tap to draw your signature here</Text>
                <Text style={styles.signatureX}>X</Text>
                <View style={styles.signatureLine} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setIsChecked(!isChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
              {isChecked && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I acknowledge that this digital signature is legally binding.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.signButton, (!isChecked || isSubmitting) && styles.signButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isChecked || isSubmitting}
          onPress={async () => {
            if (!signatureBase64 || !placeOfSignature) {
              alert("Please sign the document before continuing.");
              setShowSignatureModal(true);
              return;
            }
            
            // If signing an existing admin-created investment
            if (params.investmentId) {
              try {
                setIsSubmitting(true);
                const { investmentService } = require('../../services/investment.service');
                await investmentService.signAdminInvestment(
                  params.investmentId as string,
                  signatureBase64,
                  placeOfSignature
                );
                alert("Agreement successfully signed!");
                router.back();
              } catch (e: any) {
                alert(e.response?.data?.message || "Failed to sign agreement");
              } finally {
                setIsSubmitting(false);
              }
              return;
            }
            
            // Normal flow: Save to store and proceed to payment
            signatureStore.signatureBase64 = signatureBase64;
            signatureStore.placeOfSignature = placeOfSignature;
            
            // Push to payment screen with params
            router.push({
              pathname: "/payment",
              params: {
                propertyId: params.propertyId,
                units: params.units,
                amount: params.amount,
              },
            });
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.onPrimary} size="small" />
          ) : (
            <Ionicons name="pencil" size={18} color={isChecked ? Colors.onPrimary : Colors.outline} />
          )}
          <Text style={[styles.signButtonText, (!isChecked || isSubmitting) && styles.signButtonTextDisabled]}>
            {isSubmitting ? "Signing..." : params.investmentId ? "Sign Agreement" : "Sign & Continue"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Powered by Silverreal SecureSign</Text>
      </View>

      {/* Signature Modal */}
      <Modal
        visible={showSignatureModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <View style={styles.modalOverlayFull}>
          <View style={styles.signatureModalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.signatureModalTitle}>Sign Agreement</Text>
              {isLocating && <ActivityIndicator color={Colors.primary} size="small" style={{ marginLeft: 12, marginBottom: 16 }} />}
            </View>

            <Text style={styles.signatureModalLabel}>Please draw your signature below:</Text>
            <View style={styles.signatureWrapper}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleSignatureOK}
                onEmpty={() => alert("Please sign the document.")}
                descriptionText=""
                clearText="Clear"
                confirmText="Save"
                webStyle={`
                  .m-signature-pad { box-shadow: none; border: none; margin: 0; padding: 0; }
                  .m-signature-pad--body { border: none; }
                  .m-signature-pad--footer { display: none; }
                `}
              />
            </View>

            <View style={styles.signatureActionRow}>
              <TouchableOpacity
                style={styles.sigBtnClear}
                onPress={() => signatureRef.current?.clearSignature()}
              >
                <Text style={styles.sigBtnClearText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sigBtnConfirm}
                onPress={() => signatureRef.current?.readSignature()}
              >
                <Text style={styles.sigBtnConfirmText}>Save Signature</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelSignatureButton}
              onPress={() => setShowSignatureModal(false)}
            >
              <Text style={styles.cancelSignatureText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    paddingBottom: 16,
    marginBottom: 16,
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  documentBody: {
    height: 250,
  },
  docHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 12,
    marginBottom: 4,
  },
  docText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.onSurfaceVariant,
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 8,
  },
  signatureSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  signaturePad: {
    height: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  signaturePlaceholderText: {
    fontSize: 14,
    color: Colors.outlineVariant,
    opacity: 0.5,
  },
  signatureX: {
    position: "absolute",
    left: 16,
    bottom: 16,
    fontSize: 16,
    color: Colors.outlineVariant,
    fontWeight: "600",
  },
  signatureLine: {
    position: "absolute",
    left: 36,
    bottom: 16,
    right: 16,
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  signatureImagePreview: {
    width: "100%",
    height: 60,
    marginBottom: 8,
  },
  signaturePadSigned: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.primary,
    borderStyle: "solid",
    padding: 8,
  },
  signedContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  signedPlaceText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  tapToEdit: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 4,
    opacity: 0.7,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlayFull: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  signatureModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    height: "85%",
  },
  signatureModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 20,
  },
  signatureModalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 12,
  },
  signatureWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    overflow: "hidden",
  },
  signatureActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  sigBtnClear: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    alignItems: "center",
  },
  sigBtnClearText: {
    color: Colors.error,
    fontWeight: "600",
    fontSize: 16,
  },
  sigBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  sigBtnConfirmText: {
    color: Colors.onPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  cancelSignatureButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  cancelSignatureText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  checkboxLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  bottomAction: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 16,
    paddingBottom: 32, // safe area padding
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  signButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: 12,
  },
  signButtonDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
  signButtonTextDisabled: {
    color: Colors.outline,
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
  },
});
