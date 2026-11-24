"""Build assets/brand/qr-give.svg: dark #111827 modules, no quiet zone (the white tile padding is the quiet zone)."""
import sys, qrcode
URL = "https://secure.qgiv.com/for/theapologistproject"
q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
q.add_data(URL); q.make(fit=True)
m = q.get_matrix(); n = len(m)
d = "".join(f"M{x},{y}h1v1h-1z" for y, row in enumerate(m) for x, v in enumerate(row) if v)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
       f'<path fill="#111827" d="{d}"/></svg>\n')
open(sys.argv[1] if len(sys.argv) > 1 else "assets/brand/qr-give.svg", "w").write(svg)
print("version", q.version, "modules", n)
