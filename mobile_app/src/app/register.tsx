import { useLocalSearchParams, useRouter } from "expo-router";
import RegisterPage from "@/pages/Register";

export default function RegisterScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  return (
    <RegisterPage 
      registrationToken={token}
      onGoBackToLogin={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
    />
  );
}
