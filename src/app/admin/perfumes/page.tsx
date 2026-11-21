import { Suspense } from "react";
import { connection } from "next/server";
import { DataTable } from "@/components/admin/data-table";
import {
  CreateButton,
  UpdateButton,
  type FormField,
} from "@/components/admin/create-update-buttons";
import { formatDateTime } from "@/lib/format";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import { createPerfume, updatePerfume } from "./actions";

async function PerfumesData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const orderBy = { name: "asc" } as const;
  const [perfumes, brands, formulationTypes, collections] = await Promise.all([
    queryOrEmpty(() =>
      prisma.perfume.findMany({
        include: {
          brand: { select: { name: true } },
          formulationType: { select: { name: true } },
          collection: { select: { name: true } },
        },
        orderBy,
      }),
    ),
    queryOrEmpty(() =>
      prisma.brand.findMany({ select: { id: true, name: true }, orderBy }),
    ),
    queryOrEmpty(() =>
      prisma.formulationType.findMany({
        select: { id: true, name: true },
        orderBy,
      }),
    ),
    queryOrEmpty(() =>
      prisma.collection.findMany({
        select: { id: true, name: true, brandId: true },
        orderBy,
      }),
    ),
  ]);

  const fields: FormField[] = [
    { name: "name", label: "Name", kind: "text", required: true },
    {
      name: "brandId",
      label: "Brand",
      kind: "select",
      required: true,
      options: brands.map(({ id, name }) => ({ value: id, label: name })),
    },
    {
      name: "formulationTypeId",
      label: "Formulation type",
      kind: "select",
      required: true,
      options: formulationTypes.map(({ id, name }) => ({
        value: id,
        label: name,
      })),
    },
    {
      name: "collectionId",
      label: "Collection",
      kind: "select",
      description: "Optional. Only the chosen brand's collections are listed.",
      parentField: "brandId",
      options: collections.map(({ id, name, brandId }) => ({
        value: id,
        label: name,
        parent: brandId,
      })),
    },
    { name: "descr", label: "Description", kind: "textarea" },
  ];

  return (
    <DataTable
      action={
        <CreateButton
          noun="perfume"
          fields={fields}
          action={createPerfume}
        />
      }
      columns={[
        { key: "name", label: "Name", filter: "search" },
        { key: "descr", label: "Description" },
        { key: "brand", label: "Brand", filter: "select" },
        { key: "formulationType", label: "Formulation Type" },
        { key: "collection", label: "Collection", filter: "search" },
        { key: "updatedAt", label: "Updated At" },
        { key: "createdAt", label: "Created At" },
      ]}
      rows={perfumes.map((perfume) => ({
        id: perfume.id,
        name: perfume.name,
        descr: perfume.descr,
        brand: perfume.brand.name,
        formulationType: perfume.formulationType.name,
        collection: perfume.collection?.name ?? null,
        updatedAt: formatDateTime(perfume.updatedAt),
        createdAt: formatDateTime(perfume.createdAt),
      }))}
      rowActions={Object.fromEntries(
        perfumes.map((perfume) => [
          perfume.id,
          <UpdateButton
            key={perfume.id}
            noun="perfume"
            label={perfume.name}
            fields={fields}
            initialValues={{
              name: perfume.name,
              brandId: perfume.brandId,
              formulationTypeId: perfume.formulationTypeId,
              collectionId: perfume.collectionId ?? "",
              descr: perfume.descr ?? "",
            }}
            action={updatePerfume.bind(null, perfume.id)}
          />,
        ]),
      )}
    />
  );
}

export default function AdminPerfumesPage() {
  return (
    <>
      <h1>Perfumes</h1>
      <Suspense fallback={<p>Loading perfumes...</p>}>
        <PerfumesData />
      </Suspense>
    </>
  );
}
