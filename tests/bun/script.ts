import { getImgPlaceholderFromStream } from "openimg-bun";
import { createReadStream } from "fs";

// Retrieve file from ./public/cat.png
const stream = createReadStream("./public/cat.png");
const placeholder = await getImgPlaceholderFromStream(stream);
console.log(placeholder);
