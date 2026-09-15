import PropertyForm from "../../../components/properties/PropertyForm";

export const metadata = {
  title: "Add Property | SilverReal Estate",
};

export default function AddPropertyPage() {
  return <PropertyForm isEdit={false} />;
}
