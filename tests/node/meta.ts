import { getImgMetadata } from "openimg/node";
import { createReadStream } from "fs";

const stream = createReadStream("./public/cat.png");
const meta = await getImgMetadata(stream);
console.log(meta);

const stream2 = createReadStream("./public/exif.jpeg");
const meta2 = await getImgMetadata(stream2);
console.log(meta2);
