"use client";

import "@/styles/globals.css";

import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  RedirectToSignIn,
} from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "@/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

function ClerkAuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();
  const { mutate: createPlayer } = api.player.createFromClerk.useMutation();

  useEffect(() => {
    if (isLoaded && user) {
      createPlayer({
        clerkId: user.id,
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress.split("@")[0]?.split(".")[0] ??
          "Unknown",
        email: user.primaryEmailAddress?.emailAddress ?? "",
      });
    }
  }, [isLoaded, user, createPlayer]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        layout: { unsafe_disableDevelopmentModeWarnings: true },
      }}
    >
      <html lang="sv" className={`${geist.variable}`} suppressHydrationWarning>
        <body>
          <TRPCReactProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            >
              <ClerkAuthWrapper>
                <div className="flex min-h-screen flex-col">
                  <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex w-full justify-evenly border-b backdrop-blur">
                    <Navbar />
                    <div className="flex">
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                  </header>
                  <main className="bg-background flex-1">{children}</main>
                </div>
              </ClerkAuthWrapper>
            </ThemeProvider>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
