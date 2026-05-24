import os

ply_path = "/www/wwwroot/vectra.parsabe.com/resources/files/point_cloud.ply"
out_path = "/www/wwwroot/vectra.parsabe.com/resources/files/point_cloud_optimized.ply"

print("Starting optimization...")
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

# Downsample by keeping every 5th vertex (reducing payload and parse workload by 80%)
decimation = 5
optimized_data = bytearray()
for i in range(0, num_vertices, decimation):
    start = i * vertex_size
    end = start + vertex_size
    optimized_data.extend(vertex_data[start:end])

new_vertex_count = len(optimized_data) // vertex_size
print(f"Optimized vertices: {new_vertex_count}")

# Replace vertex count in header
header_text = header_bytes.decode('ascii', errors='ignore')
old_line = "element vertex 2546902"
new_line = f"element vertex {new_vertex_count}"
new_header_text = header_text.replace(old_line, new_line)

new_header_bytes = new_header_text.encode('ascii')

with open(out_path, "wb") as f:
    f.write(new_header_bytes)
    f.write(optimized_data)

print(f"Optimized PLY file saved at: {out_path}")
