"use client";

import { useState, useTransition } from "react";
import {
  ActionIcon,
  AddIcon,
  Alert,
  Button,
  CloseIcon,
  EditIcon,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@/components/ui";
import type { FormValues, SaveResult } from "@/lib/admin-save";

export type SelectOption = {
  value: string;
  label: string;
  // Set on options that only apply to one choice of another field (a brand's collections).
  parent?: string;
};

export type FormField = {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
} & (
  | { kind: "text" | "textarea" | "url" | "date" }
  // With parentField, only options whose parent matches that field's value are shown.
  | { kind: "select"; options: SelectOption[]; parentField?: string }
);

type FormProps = {
  fields: FormField[];
  action: (values: FormValues) => Promise<SaveResult>;
};

// "Add ..." button that opens a form for one new row of an admin table.
export function CreateButton({
  noun,
  ...formProps
}: FormProps & {
  // What is being added, e.g. "brand" for "Add brand".
  noun: string;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button
        size="xs"
        leftSection={<AddIcon size={14} />}
        onClick={() => setOpened(true)}
      >
        Add {noun}
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Add a new ${noun}`}
      >
        {/* Modal unmounts its content when closed, so each open starts a fresh form. */}
        <Form
          {...formProps}
          submitLabel={`Add ${noun}`}
          onClose={() => setOpened(false)}
        />
      </Modal>
    </>
  );
}

// Pencil button that opens the same form filled with one row's current values.
export function UpdateButton({
  noun,
  label,
  initialValues,
  ...formProps
}: FormProps & {
  noun: string;
  // Names the row for screen readers, e.g. "Edit Shopee".
  label: string;
  initialValues: FormValues;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <ActionIcon
        variant="subtle"
        aria-label={`Edit ${label}`}
        onClick={() => setOpened(true)}
      >
        <EditIcon size={16} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Edit ${noun}`}
      >
        <Form
          {...formProps}
          initialValues={initialValues}
          submitLabel="Save"
          onClose={() => setOpened(false)}
        />
      </Modal>
    </>
  );
}

function Form({
  fields,
  action,
  initialValues = {},
  submitLabel,
  onClose,
}: FormProps & {
  initialValues?: FormValues;
  submitLabel: string;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setValue(name: string, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // A changed parent can leave a dependent choice invalid, so clear it.
      for (const field of fields) {
        if (field.kind === "select" && field.parentField === name) {
          next[field.name] = "";
        }
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await action(values);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {fields.map((field, index) => {
          const common = {
            label: field.label,
            description: field.description,
            required: field.required,
            "data-autofocus": index === 0 || undefined,
          };
          const value = values[field.name] ?? "";

          if (field.kind === "select") {
            const parentValue = field.parentField
              ? values[field.parentField]
              : undefined;
            const parentLabel = fields.find(
              ({ name }) => name === field.parentField,
            )?.label;
            return (
              <Select
                key={field.name}
                {...common}
                searchable
                disabled={field.parentField !== undefined && !parentValue}
                placeholder={
                  field.parentField && !parentValue
                    ? `Choose a ${parentLabel?.toLowerCase()} first`
                    : "Search"
                }
                data={field.options.filter(
                  (option) =>
                    !field.parentField || option.parent === parentValue,
                )}
                value={value || null}
                onChange={(next) => setValue(field.name, next ?? "")}
                nothingFoundMessage="Nothing found"
              />
            );
          }
          if (field.kind === "textarea") {
            return (
              <Textarea
                key={field.name}
                {...common}
                autosize
                minRows={2}
                value={value}
                onChange={(event) =>
                  setValue(field.name, event.currentTarget.value)
                }
              />
            );
          }
          return (
            <TextInput
              key={field.name}
              {...common}
              type={field.kind === "date" ? "date" : "text"}
              placeholder={field.kind === "url" ? "https://" : undefined}
              value={value}
              onChange={(event) =>
                setValue(field.name, event.currentTarget.value)
              }
              // Date inputs have no reliable built-in way to empty them.
              rightSectionPointerEvents="all"
              rightSection={
                field.kind === "date" &&
                value && (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={`Clear ${field.label.toLowerCase()}`}
                    onClick={() => setValue(field.name, "")}
                  >
                    <CloseIcon size={14} />
                  </ActionIcon>
                )
              }
            />
          );
        })}
        {/* Next to the buttons: the top of a long form can be scrolled out of view. */}
        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
