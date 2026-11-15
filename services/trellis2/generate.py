"""Offline TRELLIS.2 image-to-GLB worker. Run in the official TRELLIS.2 GPU environment.

Usage:
  python services/trellis2/generate.py --input /data/chirashi.png --output /data/chirashi.glb

Install microsoft/TRELLIS.2 and its CUDA dependencies separately (see docs/trellis2-pipeline.md).
This script does not run on Vercel. No production API or job queue is implied.
"""
import argparse
import os
from pathlib import Path

os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Stylized reference image, preferably isolated on transparent background")
    parser.add_argument("--output", required=True, help="GLB output path")
    parser.add_argument("--resolution", choices=["512", "1024", "1536"], default="1024",
                        help="Requested quality tier (see upstream docs; actual resolution is model-dependent)")
    parser.add_argument("--texture-size", type=int, default=4096)
    parser.add_argument("--decimation-target", type=int, default=100000)
    args = parser.parse_args()

    from PIL import Image
    import o_voxel
    from trellis2.pipelines import Trellis2ImageTo3DPipeline

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(args.input).convert("RGBA")
    model = Trellis2ImageTo3DPipeline.from_pretrained("microsoft/TRELLIS.2-4B")
    model.cuda()
    mesh = model.run(image)[0]
    mesh.simplify(16777216)
    glb = o_voxel.postprocess.to_glb(
        vertices=mesh.vertices,
        faces=mesh.faces,
        attr_volume=mesh.attrs,
        coords=mesh.coords,
        attr_layout=mesh.layout,
        voxel_size=mesh.voxel_size,
        aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
        decimation_target=args.decimation_target,
        texture_size=args.texture_size,
        remesh=True,
        remesh_band=1,
        remesh_project=0,
        verbose=True,
    )
    glb.export(str(output), extension_webp=True)
    print(f"Exported {output}")


if __name__ == "__main__":
    main()
