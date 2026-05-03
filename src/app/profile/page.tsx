import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/bitecheck/profile/ProfileForm";
import { loadHydratedProfile } from "@/lib/user-profile";

export const metadata = {
  title: "Profile · BiteCheck",
};

export default async function ProfilePage() {
  const profile = await loadHydratedProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "28px 20px 56px",
      }}
    >
      <ProfileForm profile={profile} />
    </main>
  );
}

