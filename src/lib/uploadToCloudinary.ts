/**
 * Uploads a file directly to Cloudinary via unsigned upload.
 * Returns { url, type: 'image' | 'file', name }
 */
export async function uploadToCloudinary(file: File): Promise<{
  url: string;
  type: "image" | "file";
  name: string;
} | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary env vars missing");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "chat_attachments");

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) return null;
    const data = await res.json();

    return {
      url: data.secure_url,
      type: file.type.startsWith("image/") ? "image" : "file",
      name: file.name,
    };
  } catch {
    return null;
  }
}

export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}
