import { Suspense } from "react";
import { connection } from "next/server";
import { DataTable } from "@/components/admin/data-table";
import {
  CreateButton,
  UpdateButton,
  type FormField,
} from "@/components/admin/create-update-buttons";
import { SimpleGrid } from "@/components/ui";
import type { FormValues, SaveResult } from "@/lib/admin-save";
import { formatDateTime } from "@/lib/format";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import {
  createFormulationType,
  createPlatform,
  createVerificationType,
  updateFormulationType,
  updatePlatform,
  updateVerificationType,
} from "./actions";

const FIELDS: FormField[] = [
  { name: "name", label: "Name", kind: "text", required: true },
  {
    name: "varName",
    label: "Variable name",
    kind: "text",
    required: true,
    description:
      "For use in code, e.g. authorizedRetailer. Letters, numbers and underscores.",
  },
];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "varName", label: "Variable Name" },
  { key: "updatedAt", label: "Updated At" },
  { key: "createdAt", label: "Created At" },
];

type LookupRow = {
  id: string;
  name: string;
  varName: string;
  updatedAt: Date;
  createdAt: Date;
};

// One lookup table, with its add button and an edit button on each row.
function LookupTable({
  title,
  noun,
  rows,
  create,
  update,
}: {
  title: string;
  noun: string;
  rows: LookupRow[];
  create: (values: FormValues) => Promise<SaveResult>;
  update: (id: string, values: FormValues) => Promise<SaveResult>;
}) {
  return (
    <DataTable
      title={title}
      action={<CreateButton noun={noun} fields={FIELDS} action={create} />}
      columns={COLUMNS}
      // Narrow enough for a grid cell; dates scroll sideways when shown.
      minWidth={320}
      rows={rows.map((row) => ({
        id: row.id,
        name: row.name,
        varName: row.varName,
        updatedAt: formatDateTime(row.updatedAt),
        createdAt: formatDateTime(row.createdAt),
      }))}
      rowActions={Object.fromEntries(
        rows.map((row) => [
          row.id,
          <UpdateButton
            key={row.id}
            noun={noun}
            label={row.name}
            fields={FIELDS}
            initialValues={{ name: row.name, varName: row.varName }}
            action={update.bind(null, row.id)}
          />,
        ]),
      )}
    />
  );
}

async function LookupsData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const orderBy = { name: "asc" } as const;
  const [platforms, formulationTypes, verificationTypes] = await Promise.all([
    queryOrEmpty(() => prisma.platform.findMany({ orderBy })),
    queryOrEmpty(() => prisma.formulationType.findMany({ orderBy })),
    queryOrEmpty(() => prisma.verificationType.findMany({ orderBy })),
  ]);

  // Side by side in a grid rather than each stretched across the page.
  return (
    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing={48}>
      <LookupTable
        title="Platforms"
        noun="platform"
        rows={platforms}
        create={createPlatform}
        update={updatePlatform}
      />
      <LookupTable
        title="Formulation Types"
        noun="formulation type"
        rows={formulationTypes}
        create={createFormulationType}
        update={updateFormulationType}
      />
      <LookupTable
        title="Verification Types"
        noun="verification type"
        rows={verificationTypes}
        create={createVerificationType}
        update={updateVerificationType}
      />
    </SimpleGrid>
  );
}

export default function AdminLookupsPage() {
  return (
    <>
      <h1>Platforms, Formulation Types and Verification Types</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <LookupsData />
      </Suspense>
    </>
  );
}
