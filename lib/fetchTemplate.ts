import fs from "fs";
import path from "path";

// Make sure to use the new template file from the correct location
export function getTemplateHtml(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "lib/template.html"),
    "utf-8"
  );
}
