import { Suspense } from "react";
import { connection } from "next/server";
import { DataTable } from "@/components/admin/data-table";
import {
  CreateButton,
  UpdateButton,
  type FormField,
  type SelectOption,
} from "@/components/admin/create-update-buttons";
import { Stack } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import {
  createBrand,
  createBrandLink,
  createCollection,
  updateBrand,
  updateBrandLink,
  updateCollection,
} from "./actions";

const toOptions = (rows: { id: string; name: string }[]): SelectOption[] =>
  rows.map(({ id, name }) => ({ value: id, label: name }));

const BRAND_FIELDS: FormField[] = [
  { name: "name", label: "Name", kind: "text", required: true },
  { name: "owner", label: "Owner", kind: "text" },
  { name: "company", label: "Company", kind: "text" },
  { name: "address", label: "Address", kind: "textarea" },
  { name: "descr", label: "Description", kind: "textarea" },
  { name: "remarks", label: "Remarks", kind: "textarea" },
];

async function BrandsData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const orderBy = { name: "asc" } as const;
  const [brands, brandLinks, collections, platforms, verificationTypes] =
    await Promise.all([
      queryOrEmpty(() => prisma.brand.findMany({ orderBy: { name: "asc" } })),
      queryOrEmpty(() =>
        prisma.brandLink.findMany({
          include: {
            brand: { select: { name: true } },
            platform: { select: { name: true } },
            verificationType: { select: { name: true } },
          },
          orderBy: { brand: { name: "asc" } },
        }),
      ),
      queryOrEmpty(() =>
        prisma.collection.findMany({
          include: { brand: { select: { name: true } } },
          orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
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
  const brandOptions = toOptions(brands);

  const brandLinkFields: FormField[] = [
    {
      name: "brandId",
      label: "Brand",
      kind: "select",
      required: true,
      options: brandOptions,
    },
    {
      name: "platformId",
      label: "Platform",
      kind: "select",
      required: true,
      options: toOptions(platforms),
    },
    { name: "link", label: "Link", kind: "url", required: true },
    {
      name: "verificationTypeId",
      label: "Verification type",
      kind: "select",
      required: true,
      options: toOptions(verificationTypes),
    },
    { name: "verificationDate", label: "Verification date", kind: "date" },
  ];

  const collectionFields: FormField[] = [
    {
      name: "brandId",
      label: "Brand",
      kind: "select",
      required: true,
      options: brandOptions,
    },
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "descr", label: "Description", kind: "textarea" },
  ];

  // Extra space between tables, so each reads as its own section.
  return (
    <Stack gap={48}>
      <DataTable
        title="Brands"
        action={
          <CreateButton
            noun="brand"
            fields={BRAND_FIELDS}
            action={createBrand}
          />
        }
        columns={[
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          { key: "owner", label: "Owner" },
          { key: "company", label: "Company" },
          { key: "descr", label: "Description" },
          { key: "remarks", label: "Remarks" },
          { key: "updatedAt", label: "Updated At" },
          { key: "createdAt", label: "Created At" },
        ]}
        rows={brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          address: brand.address,
          owner: brand.owner,
          company: brand.company,
          descr: brand.descr,
          remarks: brand.remarks,
          updatedAt: formatDateTime(brand.updatedAt),
          createdAt: formatDateTime(brand.createdAt),
        }))}
        rowActions={Object.fromEntries(
          brands.map((brand) => [
            brand.id,
            <UpdateButton
              key={brand.id}
              noun="brand"
              label={brand.name}
              fields={BRAND_FIELDS}
              initialValues={{
                name: brand.name,
                owner: brand.owner ?? "",
                company: brand.company ?? "",
                address: brand.address ?? "",
                descr: brand.descr ?? "",
                remarks: brand.remarks ?? "",
              }}
              action={updateBrand.bind(null, brand.id)}
            />,
          ]),
        )}
      />
      <DataTable
        title="Brand Links"
        action={
          <CreateButton
            noun="brand link"
            fields={brandLinkFields}
            action={createBrandLink}
          />
        }
        columns={[
          { key: "brand", label: "Brand", filter: "select" },
          { key: "platform", label: "Platform" },
          { key: "link", label: "Link" },
          { key: "verificationType", label: "Verification Type" },
          { key: "verificationDate", label: "Verification Date" },
          { key: "updatedAt", label: "Updated At" },
          { key: "createdAt", label: "Created At" },
        ]}
        rows={brandLinks.map((link) => ({
          id: link.id,
          brand: link.brand.name,
          platform: link.platform.name,
          link: link.link,
          verificationType: link.verificationType.name,
          verificationDate: formatDate(link.verificationDate),
          updatedAt: formatDateTime(link.updatedAt),
          createdAt: formatDateTime(link.createdAt),
        }))}
        rowActions={Object.fromEntries(
          brandLinks.map((link) => [
            link.id,
            <UpdateButton
              key={link.id}
              noun="brand link"
              label={`${link.brand.name} on ${link.platform.name}`}
              fields={brandLinkFields}
              initialValues={{
                brandId: link.brandId,
                platformId: link.platformId,
                link: link.link,
                verificationTypeId: link.verificationTypeId,
                verificationDate: formatDate(link.verificationDate) ?? "",
              }}
              action={updateBrandLink.bind(null, link.id)}
            />,
          ]),
        )}
      />
      <DataTable
        title="Collections"
        action={
          <CreateButton
            noun="collection"
            fields={collectionFields}
            action={createCollection}
          />
        }
        columns={[
          { key: "name", label: "Name" },
          { key: "brand", label: "Brand", filter: "select" },
          { key: "descr", label: "Description" },
          { key: "updatedAt", label: "Updated At" },
          { key: "createdAt", label: "Created At" },
        ]}
        rows={collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          brand: collection.brand.name,
          descr: collection.descr,
          updatedAt: formatDateTime(collection.updatedAt),
          createdAt: formatDateTime(collection.createdAt),
        }))}
        rowActions={Object.fromEntries(
          collections.map((collection) => [
            collection.id,
            <UpdateButton
              key={collection.id}
              noun="collection"
              label={`${collection.name} (${collection.brand.name})`}
              fields={collectionFields}
              initialValues={{
                brandId: collection.brandId,
                name: collection.name,
                descr: collection.descr ?? "",
              }}
              action={updateCollection.bind(null, collection.id)}
            />,
          ]),
        )}
      />
    </Stack>
  );
}

export default function AdminBrandsPage() {
  return (
    <>
      <h1>Brands, Brand Links and Collections</h1>
      <Suspense fallback={<p>Loading brands...</p>}>
        <BrandsData />
      </Suspense>
    </>
  );
}
