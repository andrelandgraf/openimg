import { getImgPlaceholder } from "openimg/bun";
import { createReadStream } from "fs";

const stream = createReadStream("./public/cat.png");
const placeholder = await getImgPlaceholder(stream);
console.log(placeholder);
