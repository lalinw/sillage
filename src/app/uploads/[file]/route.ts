import { readImage } from "@/lib/image-storage";

// Serves uploaded images. Each upload gets a new file name, so a file never
// changes and browsers can cache it for good.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/uploads/[file]">,
) {
  const { file } = await ctx.params;
  const image = await readImage(file);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
