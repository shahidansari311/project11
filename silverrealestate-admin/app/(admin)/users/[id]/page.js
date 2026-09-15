import UserDetailView from "@/components/users/UserDetailView";

export const metadata = {
  title: "User Details | SilverReal Estate",
};

export default async function UserDetailPage({ params }) {
  const { id } = await params;
  return <UserDetailView id={id} />;
}
