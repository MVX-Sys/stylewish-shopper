import { toast } from "sonner";

export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".jxl"];
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif", "image/jxl"];

export const isHeic = (f: File) =>
  /\.hei[cf]$/i.test(f.name) || /image\/hei[cf]/i.test(f.type);

export const convertHeic = async (f: File): Promise<File> => {
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = (await heic2any({ 
      blob: f, 
      toType: "image/jpeg", 
      quality: 0.9 
    })) as Blob;
    
    const newName = f.name.replace(/\.hei[cf]$/i, ".jpg");
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (err) {
    console.error("HEIC conversion failed", err);
    throw new Error(`Falha ao converter HEIC: ${f.name}`);
  }
};

export const processImageFile = async (file: File): Promise<File> => {
  if (isHeic(file)) {
    toast.info(`Convertendo ${file.name}...`);
    return await convertHeic(file);
  }
  return file;
};
