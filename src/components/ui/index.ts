// Single entry point for UI primitives and icons.
//
// App code imports from "@/components/ui" — never directly from a UI or icon
// library, so swapping libraries later only touches this folder.

export {
  ActionIcon,
  Affix,
  Alert,
  Anchor,
  Box,
  Button,
  Checkbox,
  FileButton,
  Flex,
  Group,
  Image,
  Modal,
  NumberInput,
  Paper,
  Pill,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
export {
  ArrowDown as SortDescendingIcon,
  ArrowUp as SortAscendingIcon,
  ArrowUpDown as SortIcon,
  ChevronLeft as PreviousIcon,
  ChevronRight as NextIcon,
  Compass as DevNavIcon,
  ImagePlus as UploadImageIcon,
  Pencil as EditIcon,
  Plus as AddIcon,
  X as CloseIcon,
} from "lucide-react";
