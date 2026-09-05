import { uploadProductPhoto } from "@/lib/admin.functions";

export async function uploadImage(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10MB.");
  const buffer = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  const res = await uploadProductPhoto({
    data: {
      fileName: file.name,
      contentType: file.type || "image/jpeg",
      base64: btoa(binary),
    },
  });
  return res.url;
}
