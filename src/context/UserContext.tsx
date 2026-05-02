"use client";

import * as React from "react";
import type { HydratedUserProfile } from "@/lib/user-profile";

type UserCtx = {
  profile: HydratedUserProfile | null;
};

const UserContext = React.createContext<UserCtx>({ profile: null });

export function UserContextProvider({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: HydratedUserProfile | null;
}) {
  return (
    <UserContext.Provider value={{ profile }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return React.useContext(UserContext);
}
