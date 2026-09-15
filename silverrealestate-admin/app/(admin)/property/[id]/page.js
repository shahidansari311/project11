import PropertyDetailView from "@/components/properties/PropertyDetailView";

export const metadata = {
  title: "Property Details | SilverReal Estate",
};

export default async function PropertyDetailPage({ params }) {
  const { id } = await params;
  return <PropertyDetailView id={id} />;
}
