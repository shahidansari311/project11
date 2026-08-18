import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface StatusTrackerProps {
  status: "PENDING" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUIRED" | null;
  remark?: string;
  documentName: string;
  onView?: () => void;
}

export default function DocumentStatusTracker({ status, remark, documentName, onView }: StatusTrackerProps) {
  if (!status) return null;

  const isRejected = status === "REJECTED" || status === "REUPLOAD_REQUIRED";
  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";

  return (
    <View style={styles.container}>
      {isRejected ? (
        <View style={styles.rejectedCard}>
          <View style={styles.rejectedHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="alert-circle" size={24} color={Colors.error} />
              <Text style={styles.rejectedTitle}>{documentName} Rejected</Text>
            </View>
            {onView && (
              <TouchableOpacity style={[styles.viewButton, { backgroundColor: Colors.errorContainer, borderWidth: 1, borderColor: Colors.error + "40" }]} onPress={onView} activeOpacity={0.7}>
                <Ionicons name="eye-outline" size={18} color={Colors.onPrimaryContainer} />
                <Text style={[styles.viewButtonText, { color: Colors.onPrimaryContainer }]}>View</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.rejectedSubtitle}>
            Your document was rejected by the admin. Please upload a clear and valid copy.
          </Text>
          {remark && (
            <View style={styles.remarkBox}>
              <Text style={styles.remarkLabel}>Admin Remark:</Text>
              <Text style={styles.remarkText}>{remark}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.trackerCard}>
          <View style={styles.trackerHeaderRow}>
            <Text style={styles.trackerTitle}>{documentName} Status</Text>
            {onView && (
              <TouchableOpacity style={styles.viewButton} onPress={onView} activeOpacity={0.7}>
                <Ionicons name="eye-outline" size={18} color={Colors.onPrimaryContainer} />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.stepsContainer}>
            {/* Step 1: Uploaded */}
            <View style={styles.step}>
              <View style={[styles.node, styles.nodeActive]}>
                <Ionicons name="checkmark" size={16} color={Colors.surfaceContainerLowest} />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Uploaded Successfully</Text>
                <Text style={styles.stepSubtitle}>We have received your document</Text>
              </View>
            </View>

            <View style={[styles.line, styles.lineActive]} />

            {/* Step 2: Verification */}
            <View style={styles.step}>
              <View style={[styles.node, (isPending || isApproved) ? styles.nodeActive : styles.nodeInactive]}>
                {(isPending || isApproved) && <Ionicons name="checkmark" size={16} color={Colors.surfaceContainerLowest} />}
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={[styles.stepTitle, !(isPending || isApproved) && styles.textInactive]}>
                  Verification in Progress
                </Text>
                <Text style={[styles.stepSubtitle, !(isPending || isApproved) && styles.textInactive]}>
                  Admin is reviewing your details
                </Text>
              </View>
            </View>

            <View style={[styles.line, isApproved ? styles.lineActive : styles.lineInactive]} />

            {/* Step 3: Verified */}
            <View style={styles.step}>
              <View style={[styles.node, isApproved ? styles.nodeActive : styles.nodeInactive]}>
                {isApproved && <Ionicons name="checkmark" size={16} color={Colors.surfaceContainerLowest} />}
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={[styles.stepTitle, !isApproved && styles.textInactive]}>Verified</Text>
                <Text style={[styles.stepSubtitle, !isApproved && styles.textInactive]}>
                  Your document is approved
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  trackerCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  trackerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryContainer,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onPrimaryContainer,
    marginLeft: 4,
  },
  stepsContainer: {
    marginLeft: 8,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    zIndex: 2,
  },
  nodeActive: {
    backgroundColor: Colors.primary,
  },
  nodeInactive: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  stepTextContainer: {
    marginLeft: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  textInactive: {
    color: Colors.outline,
  },
  line: {
    position: "absolute",
    left: 11,
    top: 24,
    width: 2,
    height: 40,
    zIndex: 1,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
  lineInactive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  rejectedCard: {
    backgroundColor: Colors.errorContainer,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  rejectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rejectedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
    marginLeft: 8,
  },
  rejectedSubtitle: {
    fontSize: 14,
    color: Colors.onErrorContainer,
    marginTop: 8,
    lineHeight: 20,
  },
  remarkBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  remarkText: {
    fontSize: 14,
    color: Colors.onSurface,
  }
});
