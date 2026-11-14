"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { isWorkspaceTool, useSignedIn } from "@/lib/use-signed-in";

function barePath(pathname: string): boolean {
  return (
    pathname.startsWith("/app") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth")
  );
}

/** One frame. The workspace bar when a chair is signed in. The public bar otherwise. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const signedIn = useSignedIn();

  if (barePath(pathname)) return <main>{children}</main>;

  if (isWorkspaceTool(pathname) && signedIn) {
    return <WorkspaceFrame padded={false}>{children}</WorkspaceFrame>;
  }

  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
