import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';

// Lossless entropy compression: no simplification, welding, merging or quantization.
// Keep the original as an editable source and all 32 FDI objects independently selectable.
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const input = new URL('../public/models/arcada.glb', import.meta.url);
const output = new URL('../public/models/arcada-v2.glb', import.meta.url);
const document = await io.read(fileURLToPath(input));
const names = document.getRoot().listNodes().map(node => node.getName()).filter(name => /^tooth_/.test(name)).sort();
if (names.length !== 32 || new Set(names).size !== 32) throw new Error('Expected 32 unique FDI objects');
document.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(fileURLToPath(output), document);
const original = (await stat(input)).size, optimized = (await stat(output)).size;
console.log(JSON.stringify({ original, optimized, reduction: `${((1 - optimized / original) * 100).toFixed(1)}%`, teeth: names.length }));
