import type { NoteType } from "@/generated/prisma/enums";

export type NoteOption = {
  id: string;
  name: string;
  isMain: boolean;
  isStandalone: boolean;
};

export type PerfumeOption = {
  id: string;
  name: string;
  brand: { name: string };
  formulationType: { name: string };
};

export type FormulationRow = {
  id: string;
  year: number | null;
  discontinued: boolean;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  perfume: {
    name: string;
    brand: { name: string };
    formulationType: { name: string };
    // The perfume's first image, shown in the preview.
    images: { url: string }[];
  };
  notes: { type: NoteType; note: { id: string; name: string } }[];
};
