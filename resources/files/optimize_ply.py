import os
import struct

ply_path = "/www/wwwroot/vectra.parsabe.com/resources/files/point_cloud.ply"
out_path = "/www/wwwroot/vectra.parsabe.com/resources/files/point_cloud_optimized.ply"

print("Starting decimation and color conversion...")
if not os.path.exists(ply_path):
    print(f"Error: File {ply_path} not found.")
    exit(1)

with open(ply_path, "rb") as f:
    content = f.read()

# Find the end of header
header_end = content.find(b"end_header\n")
if header_end == -1:
    header_end = content.find(b"end_header\r\n")
    newline = b"\r\n"
else:
    newline = b"\n"

if header_end == -1:
    print("Error: end_header not found")
    exit(1)

header_bytes = content[:header_end + len(b"end_header" + newline)]
vertex_data = content[len(header_bytes):]

vertex_size = 68 # 17 properties * 4 bytes (floats)
num_vertices = len(vertex_data) // vertex_size
print(f"Original vertices: {num_vertices}")

# Struct formats for quick binary packing
# '<17f' reads the 17 floats from the input
in_struct = struct.Struct('<17f')
# '<3f3B' packs x, y, z (floats) and red, green, blue (uchars) - 15 bytes
out_struct = struct.Struct('<3f3B')

# Downsample by keeping every 5th vertex
decimation = 5
optimized_data = bytearray()

SH_C0 = 0.28209479177387814

for i in range(0, num_vertices, decimation):
    offset = i * vertex_size
    # Unpack the floats
    vals = in_struct.unpack_from(vertex_data, offset)
    x, y, z = vals[0], vals[1], vals[2]
    f_dc_0, f_dc_1, f_dc_2 = vals[6], vals[7], vals[8]

    # Convert Spherical Harmonics degree 0 to standard RGB [0, 255]
    r = int(max(0, min(255, (f_dc_0 * SH_C0 + 0.5) * 255)))
    g = int(max(0, min(255, (f_dc_1 * SH_C0 + 0.5) * 255)))
    b = int(max(0, min(255, (f_dc_2 * SH_C0 + 0.5) * 255)))

    # Pack into the optimized 15-byte format
    optimized_data.extend(out_struct.pack(x, y, z, r, g, b))

new_vertex_count = len(optimized_data) // 15
print(f"Optimized vertices: {new_vertex_count}")

# Generate the standard PLY header
new_header = (
    "ply\n"
    "format binary_little_endian 1.0\n"
    f"element vertex {new_vertex_count}\n"
    "property float x\n"
    "property float y\n"
    "property float z\n"
    "property uchar red\n"
    "property uchar green\n"
    "property uchar blue\n"
    "end_header\n"
)

with open(out_path, "wb") as f:
    f.write(new_header.encode('ascii'))
    f.write(optimized_data)

print(f"Optimized PLY file saved at: {out_path} (Size: {os.path.getsize(out_path) / 1024 / 1024:.2f} MB)")
