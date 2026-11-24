"use client";

import { useState, useTransition } from "react";
import NextImage from "next/image";
import { ImageViewer, isUpload } from "@/components/admin/image-viewer";
import {
  ActionIcon,
  FileButton,
  Group,
  Stack,
  Text,
  UnstyledButton,
  UploadImageIcon,
} from "@/components/ui";
import type { SaveResult } from "@/lib/admin-save";

const THUMBNAIL = 48;

// A perfume's image thumbnails, with a button to upload another.
// Clicking a thumbnail opens it in the image viewer.
export function PerfumeImages({
  perfumeName,
  brandName,
  images,
  upload,
}: {
  perfumeName: string;
  brandName: string;
  images: { id: string; url: string }[];
  upload: (formData: FormData) => Promise<SaveResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Index of the image open in the viewer, or null when it's closed.
  const [viewing, setViewing] = useState<number | null>(null);

  function handleFile(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    startTransition(async () => {
      const result = await upload(formData);
      setError(result.ok ? null : result.error);
    });
  }

  return (
    <Stack gap={4}>
      <Group gap={4} wrap="nowrap">
        {images.map((image, index) => (
          <UnstyledButton
            key={image.id}
            aria-label={`View image ${index + 1} of ${perfumeName}`}
            onClick={() => setViewing(index)}
            // Otherwise a narrow column squeezes thumbnails out of square.
            style={{ flexShrink: 0 }}
          >
            <NextImage
              src={image.url}
              alt=""
              width={THUMBNAIL}
              height={THUMBNAIL}
              style={{
                width: THUMBNAIL,
                height: THUMBNAIL,
                objectFit: "cover",
                borderRadius: 4,
                display: "block",
              }}
              unoptimized={!isUpload(image.url)}
            />
          </UnstyledButton>
        ))}
        <FileButton onChange={handleFile} accept="image/*">
          {(props) => (
            <ActionIcon
              {...props}
              variant="light"
              size={THUMBNAIL}
              loading={pending}
              aria-label={`Upload an image of ${perfumeName}`}
            >
              <UploadImageIcon size={20} />
            </ActionIcon>
          )}
        </FileButton>
      </Group>
      <ImageViewer
        opened={viewing !== null}
        onClose={() => setViewing(null)}
        images={images}
        startIndex={viewing ?? 0}
        title={perfumeName}
        subtitle={brandName}
      />
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}
