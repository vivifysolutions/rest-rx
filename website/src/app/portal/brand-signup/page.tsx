"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Legacy route — portal accounts are created during the /partner application. */
export default function BrandSignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portal/login");
  }, [router]);

  return (
    <div className="portal-login">
      <div className="portal-login-card" style={{ margin: "4rem auto", maxWidth: 480 }}>
        <p>
          Portal accounts are created when you submit the{" "}
          <Link href="/partner">partner application</Link>. After approval, sign in at the portal.
        </p>
      </div>
    </div>
  );
}
