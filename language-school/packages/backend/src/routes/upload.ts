import { Elysia, t } from "elysia";
import { join } from "path";
import { mkdir } from "fs/promises";

const UPLOAD_DIR = "public/uploads";

// Безопасное расширение: только буквы/цифры, иначе jpg
function getSafeExt(name: string): string {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .post("/", async ({ body, set }) => {
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      
      const file = body.file as File;
      const ext = getSafeExt(file.name);
      const fileName = `${Date.now()}.${ext}`;
      const path = join(UPLOAD_DIR, fileName);
      
      await Bun.write(path, file);
      
      return {
        url: `/uploads/${fileName}`,
        message: "File uploaded successfully"
      };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to upload file" };
    }
  }, {
    body: t.Object({
      file: t.File()
    })
  });
