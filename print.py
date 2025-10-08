from playwright.sync_api import sync_playwright
import math
import sys
import time

CHROMIUM_MAX_IN = 200  # Chromium PDF height limit in inches
CSS_NO_BREAKS = """
@media print {
  @page { size: auto; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; }
  * { break-before: avoid !important; break-after: avoid !important; break-inside: avoid !important; }
}
"""


def px_to_in(px: float) -> float:
    # Chromium uses 96 CSS px per inch
    return px / 96.0


def autoscroll(page, step=1200, pause=0.1, max_steps=200):
    # Trigger lazy loading by scrolling through the page
    last = 0
    for _ in range(max_steps):
        page.evaluate(f"window.scrollBy(0,{step});")
        time.sleep(pause)
        curr = page.evaluate("() => window.scrollY")
        if curr == last:
            break
        last = curr
    page.evaluate("window.scrollTo(0,0);")  # reset to top


def url_to_single_page_pdf(url: str, output_path: str, viewport_width=1280):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(device_scale_factor=1)
        page = context.new_page()
        page.set_viewport_size({"width": viewport_width, "height": 1000})
        page.goto(url, wait_until="load")
        page.wait_for_load_state("networkidle")

        # Avoid page breaks and margins in print
        page.add_style_tag(content=CSS_NO_BREAKS)

        # Trigger lazy content
        autoscroll(page)

        # Measure final content size
        width_px = page.evaluate(
            "() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)"
        )
        height_px = page.evaluate(
            "() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)"
        )

        width_in = px_to_in(max(width_px, viewport_width))
        height_in = px_to_in(height_px)

        if height_in > CHROMIUM_MAX_IN:
            print(
                f"Warning: content is {height_in:.1f}in tall. Chromium caps at {CHROMIUM_MAX_IN}in. "
                f"Anything beyond will be truncated."
            )
            height_in = CHROMIUM_MAX_IN

        page.pdf(
            path=output_path,
            width=f"{width_in:.3f}in",
            height=f"{height_in:.3f}in",
            print_background=True,
            prefer_css_page_size=False,
            display_header_footer=False,
        )

        browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python long_pdf.py <url> [output.pdf]")
        sys.exit(1)
    url = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "output.pdf"
    url_to_single_page_pdf(url, out)
    print(f"Wrote {out}")
