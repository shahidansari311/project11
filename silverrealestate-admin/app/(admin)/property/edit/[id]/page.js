import PropertyForm from "@/components/properties/PropertyForm";

export const metadata = {
  title: "Edit Property | SilverReal Estate",
};

export default async function EditPropertyPage({ params }) {
  const { id } = await params;
  return <PropertyForm isEdit={true} id={id} />;
}
