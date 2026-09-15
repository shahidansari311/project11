import KycPendingView from "@/components/kyc/KycPendingView";

export const metadata = {
  title: "Pending Verification | KYC Queue | SilverReal Estate Admin",
  description: "Review and verify uploaded user KYC documents (Aadhaar & PAN)",
};

export default function KycPendingPage() {
  return <KycPendingView />;
}
