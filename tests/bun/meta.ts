import { getImgMetadata } from "openimg/bun";
import { createReadStream } from "fs";

const stream = createReadStream("./public/cat.png");
const meta = await getImgMetadata(stream);
console.log(meta);
