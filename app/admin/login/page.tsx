import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/admin") ? next : "/admin";

  return (
    <div className="from-sky-tint/40 via-background to-background flex min-h-screen items-center justify-center bg-gradient-to-b px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/images/logo.png"
            alt="Pawhaus"
            width={468}
            height={85}
            priority
            className="h-10 w-auto"
          />
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-baloo text-lg">Beheerpaneel</CardTitle>
            <CardDescription>Log in om je webshop te beheren.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm next={safeNext} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
