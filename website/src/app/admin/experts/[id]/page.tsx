"use client";

import { useParams } from "next/navigation";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";

export default function AdminExpertDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminUserDetail userId={id} mode="expert" />;
}
