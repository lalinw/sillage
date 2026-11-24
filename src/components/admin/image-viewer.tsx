"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import {
  ActionIcon,
  Box,
  CloseIcon,
  Flex,
  Group,
  Modal,
  NextIcon,
  PreviousIcon,
  Stack,
  Text,
  UnstyledButton,
} from "@/components/ui";

export type ViewerImage = { id: string; url: string };

// Only uploads are resized by Next.js; links to other sites load as they are.
export const isUpload = (url: string) => url.startsWith("/uploads/");

// Full-screen spotlight for one perfume's images: the image on a dark
// background with arrows to step through them, and a side panel naming it.
// Arrow keys also step through the images, and Escape closes the viewer.
export function ImageViewer({
  opened,
  onClose,
  images,
  startIndex,
  title,
  subtitle,
}: {
  opened: boolean;
  onClose: () => void;
  images: ViewerImage[];
  startIndex: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      title={title}
      styles={{
        // The title is kept for screen readers; the side panel shows it.
        header: { display: "none" },
        body: { height: "100%" },
      }}
    >
      {/* Modal unmounts its content when closed, so each open starts here. */}
      <ViewerContent
        images={images}
        startIndex={startIndex}
        title={title}
        subtitle={subtitle}
        onClose={onClose}
      />
    </Modal>
  );
}

function ViewerContent({
  images,
  startIndex,
  title,
  subtitle,
  onClose,
}: {
  images: ViewerImage[];
  startIndex: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length;
  // Wraps around, so the last image is followed by the first.
  const step = (by: number) => setIndex((i) => (i + by + count) % count);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      if (event.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count]);

  const image = images[index];
  if (!image) return null;

  return (
    <Flex direction={{ base: "column", sm: "row" }} h="100%">
      {/* Spotlight */}
      <Box pos="relative" flex={1} miw={0} mih={0} bg="black">
        <NextImage
          key={image.id}
          src={image.url}
          alt={`${title}, image ${index + 1} of ${count}`}
          fill
          sizes="(max-width: 48em) 100vw, 80vw"
          style={{ objectFit: "contain" }}
          unoptimized={!isUpload(image.url)}
          priority
        />
        {count > 1 && (
          <>
            <ActionIcon
              pos="absolute"
              left={16}
              top="50%"
              style={{ transform: "translateY(-50%)" }}
              size={48}
              radius="xl"
              variant="default"
              aria-label="Previous image"
              onClick={() => step(-1)}
            >
              <PreviousIcon size={28} />
            </ActionIcon>
            <ActionIcon
              pos="absolute"
              right={16}
              top="50%"
              style={{ transform: "translateY(-50%)" }}
              size={48}
              radius="xl"
              variant="default"
              aria-label="Next image"
              onClick={() => step(1)}
            >
              <NextIcon size={28} />
            </ActionIcon>
          </>
        )}
      </Box>

      {/* Side panel */}
      <Stack w={{ base: "100%", sm: 300 }} p="lg" gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {title}
            </Text>
            {subtitle && <Text c="dimmed">{subtitle}</Text>}
          </Stack>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Close image viewer"
            onClick={onClose}
          >
            <CloseIcon size={20} />
          </ActionIcon>
        </Group>
        <Text size="sm" c="dimmed" aria-live="polite">
          Image {index + 1} of {count}
        </Text>
        {count > 1 && (
          <Group gap={8}>
            {images.map((thumb, i) => (
              <UnstyledButton
                key={thumb.id}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                style={{
                  borderRadius: 6,
                  outline:
                    i === index
                      ? "2px solid var(--mantine-primary-color-filled)"
                      : "none",
                  outlineOffset: 2,
                  opacity: i === index ? 1 : 0.6,
                }}
              >
                <NextImage
                  src={thumb.url}
                  alt=""
                  width={56}
                  height={56}
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "cover",
                    borderRadius: 6,
                    display: "block",
                  }}
                  unoptimized={!isUpload(thumb.url)}
                />
              </UnstyledButton>
            ))}
          </Group>
        )}
      </Stack>
    </Flex>
  );
}
