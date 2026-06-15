import path from "node:path";
import fs from "node:fs";
import { Font } from "@react-pdf/renderer";

let registered = false;

// Register Cairo (Arabic-capable) for the PDF; safe no-op if the file is missing.
export function registerPdfFonts(): boolean {
  if (registered) return true;
  const file = path.join(process.cwd(), "public", "fonts", "Cairo.ttf");
  try {
    if (fs.existsSync(file)) {
      Font.register({ family: "Cairo", src: file });
      Font.registerHyphenationCallback((word) => [word]); // don't hyphenate
      registered = true;
      return true;
    }
  } catch {
    /* fall back to default font */
  }
  return false;
}
