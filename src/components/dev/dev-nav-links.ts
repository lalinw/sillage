// Every page in the app must be listed here so it's reachable from the dev nav.
// Each inner array is one column.
export const devNavColumns = [
  [
    { href: "/", label: "Home" },
    { href: "/perfume", label: "Perfume" },
    { href: "/brand", label: "Brand" },
    { href: "/collection", label: "Collection" },
    { href: "/search", label: "Search" },
  ],
  [
    { href: "/admin", label: "Admin" },
    { href: "/admin/perfumes", label: "Perfumes" },
    { href: "/admin/formulations", label: "Formulations" },
    { href: "/admin/affiliate-links", label: "Affiliate Links" },
    { href: "/admin/notes", label: "Notes" },
    { href: "/admin/brands", label: "Brands, Brand Links & Collections" },
    { href: "/admin/lookups", label: "Platforms & Types" },
  ],
] as const;
