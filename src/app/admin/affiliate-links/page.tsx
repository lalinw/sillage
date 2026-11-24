import { Suspense } from "react";
import { connection } from "next/server";
import { DataTable } from "@/components/admin/data-table";
import {
  CreateButton,
  UpdateButton,
  type FormField,
} from "@/components/admin/create-update-buttons";
import { formatDate, formatDateTime } from "@/lib/format";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import { createAffiliateLink, updateAffiliateLink } from "./actions";

async function AffiliateLinksData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const orderBy = { name: "asc" } as const;
  const [links, perfumes, platforms, verificationTypes] = await Promise.all([
    queryOrEmpty(() =>
      prisma.affiliateLink.findMany({
        include: {
          perfume: { select: { name: true } },
          platform: { select: { name: true } },
          verificationType: { select: { name: true } },
        },
        orderBy: { perfume: { name: "asc" } },
      }),
    ),
    queryOrEmpty(() =>
      prisma.perfume.findMany({
        select: {
          id: true,
          name: true,
          brand: { select: { name: true } },
          formulationType: { select: { name: true } },
        },
        orderBy,
      }),
    ),
    queryOrEmpty(() =>
      prisma.platform.findMany({ select: { id: true, name: true }, orderBy }),
    ),
    queryOrEmpty(() =>
      prisma.verificationType.findMany({
        select: { id: true, name: true },
        orderBy,
      }),
    ),
  ]);

  const fields: FormField[] = [
    {
      name: "perfumeId",
      label: "Perfume",
      kind: "select",
      required: true,
      options: perfumes.map((perfume) => ({
        value: perfume.id,
        label: `${perfume.name} - ${perfume.brand.name} (${perfume.formulationType.name})`,
      })),
    },
    {
      name: "platformId",
      label: "Platform",
      kind: "select",
      required: true,
      options: platforms.map(({ id, name }) => ({
        value: id,
        label: name,
      })),
    },
    { name: "link", label: "Link", kind: "url", required: true },
    {
      name: "verificationTypeId",
      label: "Verification type",
      kind: "select",
      required: true,
      options: verificationTypes.map(({ id, name }) => ({
        value: id,
        label: name,
      })),
    },
    { name: "expiresAt", label: "Expires at", kind: "date" },
  ];

  return (
    <DataTable
      action={
        <CreateButton
          noun="affiliate link"
          fields={fields}
          action={createAffiliateLink}
        />
      }
      columns={[
        { key: "perfume", label: "Perfume", filter: "select" },
        {
          key: "platform",
          label: "Platform",
          filter: "select",
          sortable: true,
        },
        { key: "link", label: "Link" },
        {
          key: "verificationType",
          label: "Verification Type",
          filter: "select",
          sortable: true,
        },
        { key: "expiresAt", label: "Expires At", sortable: true },
        { key: "updatedAt", label: "Updated At" },
        { key: "createdAt", label: "Created At" },
      ]}
      rows={links.map((link) => ({
        id: link.id,
        perfume: link.perfume.name,
        platform: link.platform.name,
        link: link.link,
        verificationType: link.verificationType.name,
        expiresAt: formatDate(link.expiresAt),
        updatedAt: formatDateTime(link.updatedAt),
        createdAt: formatDateTime(link.createdAt),
      }))}
      rowActions={Object.fromEntries(
        links.map((link) => [
          link.id,
          <UpdateButton
            key={link.id}
            noun="affiliate link"
            label={`${link.perfume.name} on ${link.platform.name}`}
            fields={fields}
            initialValues={{
              perfumeId: link.perfumeId,
              platformId: link.platformId,
              link: link.link,
              verificationTypeId: link.verificationTypeId,
              expiresAt: formatDate(link.expiresAt) ?? "",
            }}
            action={updateAffiliateLink.bind(null, link.id)}
          />,
        ]),
      )}
    />
  );
}

export default function AdminAffiliateLinksPage() {
  return (
    <>
      <h1>Affiliate Links</h1>
      <Suspense fallback={<p>Loading affiliate links...</p>}>
        <AffiliateLinksData />
      </Suspense>
    </>
  );
}
