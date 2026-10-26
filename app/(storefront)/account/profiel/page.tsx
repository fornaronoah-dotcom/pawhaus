import { ProfileForm } from "@/components/account/ProfileForm";
import { getCustomerProfile } from "@/lib/customer/account";

export const metadata = { title: "Mijn profiel — Pawhaus" };

export default async function ProfilePage() {
  const profile = await getCustomerProfile();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0C2A5A] sm:text-3xl">
          Mijn profiel
        </h1>
        <p className="mt-1 text-sm text-[#0C2A5A]/60">
          Beheer je gegevens en voorkeuren.
        </p>
      </header>

      <ProfileForm profile={profile} />
    </div>
  );
}
