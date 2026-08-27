"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Micro RX lives under Resources → Micro RX subtab. */
export default function AdminMicroRxRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/resources?type=Micro%20Rx");
  }, [router]);
  return <p>Redirecting to Resources…</p>;
}
