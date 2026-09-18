import type { Metadata } from "next";
import { DeleteAccountClient } from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Delete your Rest & Rx account",
  description:
    "Permanently delete your Rest & Rx account on the web, or from Profile in the mobile app.",
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}
