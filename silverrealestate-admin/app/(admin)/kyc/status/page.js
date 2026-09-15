import KycStatusView from "@/components/kyc/KycStatusView";

export const metadata = {
  title: "Document Status | KYC Queue | SilverReal Estate Admin",
  description: "View document upload status and upload documents on behalf of users",
};

export default function KycStatusPage() {
  return <KycStatusView />;
}
