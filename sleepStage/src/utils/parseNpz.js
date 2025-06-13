import { unzipSync } from 'fflate';
import { fromArrayBuffer } from 'numpy-parser';

export async function parseNPZ(arrayBuffer) {
  const decompressed = unzipSync(new Uint8Array(arrayBuffer));
  const result = {};

  for (const fileName in decompressed) {
    const typedArray = decompressed[fileName];
    // ✅ Slice buffer to exact range (avoid overflow/corruption)
    const npyBuffer = typedArray.buffer.slice(
      typedArray.byteOffset,
      typedArray.byteOffset + typedArray.byteLength
    );

    const { data } = fromArrayBuffer(npyBuffer);
    result[fileName.replace(".npy", "")] = Array.from(data);
  }

  return result;
}