import { getPayloadInstance } from "@/lib/payload";
import MediaGallery from "./MediaGallery";

export const dynamic = "force-dynamic";

type MediaRow = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  createdAt?: string | null;
};

/** Server-render the first page of media so the grid isn't empty on arrival. */
async function listMedia(): Promise<MediaRow[]> {
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "media",
      limit: 200,
      depth: 0,
      sort: "-createdAt",
      overrideAccess: true,
    });
    return docs as MediaRow[];
  } catch {
    // Table missing / DB unreachable — the client can still load and retry.
    return [];
  }
}

export default async function CmsMediaPage() {
  const media = await listMedia();
  return <MediaGallery initial={media} />;
}
