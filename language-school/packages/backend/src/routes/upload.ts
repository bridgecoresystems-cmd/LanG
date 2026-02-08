import { Elysia, t } from "elysia";
import { join } from "path";
import { mkdir } from "fs/promises";

const UPLOAD_DIR = "public/uploads";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .post("/", async ({ body, set }) => {
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      
      const file = body.file as File;
      const fileName = `${Date.now()}-${file.name}`;
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
