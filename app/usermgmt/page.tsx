import { redirect } from "next/navigation";
import UserMgmtContainer from "./UserMgmtContainer";
import React, { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const mode = typeof params.mode === "string" ? params.mode : undefined;
  const oobCode = typeof params.oobCode === "string" ? params.oobCode : undefined;
  const continueUrl = typeof params.continueUrl === "string" ? params.continueUrl : undefined;
  if (!mode || !oobCode) {
    redirect("/");
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserMgmtContainer mode={mode} oobCode={oobCode} continueUrl={continueUrl} />
    </Suspense>
  );
}
