#!/usr/bin/env python3
"""
Scrape Cal Poly DineOnCampus menu/nutrition/dietary data into a BiteCheck CSV.

Primary usage:
  python3 scrape_calpoly_dining.py --url https://dineoncampus.com/calpoly/

Optional:
  python3 scrape_calpoly_dining.py --url https://dineoncampus.com/calpoly/ --start-date 2026-04-26
  python3 scrape_calpoly_dining.py --site-id <SITE_ID>
  python3 scrape_calpoly_dining.py --location "Vista Grande=64..." --location "1901 Marketplace=64..."

Notes:
- This script tries direct DineOnCampus API calls first because they are faster and cheaper
  than browser automation.
- If the site no longer exposes enough data through static HTML/JS, install Playwright and
  rerun with --browser-discovery:
    pip install playwright
    python3 -m playwright install chromium
    python3 scrape_calpoly_dining.py --url https://dineoncampus.com/calpoly/ --browser-discovery
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse

try:
    import cloudscraper  # type: ignore
except Exception:  # pragma: no cover
    cloudscraper = None

try:
    import requests
except Exception as exc:  # pragma: no cover
    raise SystemExit("Missing dependency: requests. Run `pip install requests cloudscraper`.") from exc

DEFAULT_CALPOLY_URL = "https://dineoncampus.com/calpoly/"
BASE_API_URL = "https://api.dineoncampus.com/v1"
APIV4_URL = "https://apiv4.dineoncampus.com"

CSV_COLUMNS = [
    "date",
    "day_of_week",
    "location",
    "building",
    "meal_period",
    "station",
    "item_name",
    "item_id",
    "portion",
    "description",
    "added_sugar_g",
    "calcium_mg",
    "calories",
    "calories_from_fat",
    "cholesterol_mg",
    "fiber_g",
    "iron_mg",
    "potassium_mg",
    "protein_g",
    "sat_fat_g",
    "sodium_mg",
    "sugar_g",
    "total_carbs_g",
    "total_fat_g",
    "trans_fat_g",
    "vitamin_c_mg",
    "vitamin_d_mcg",
    "ingredients",
    "allergens",
    "dietary_labels",
]

NUTRIENT_ALIASES = {
    "added_sugar_g": ["added sugar", "added sugars"],
    "calcium_mg": ["calcium"],
    "calories": ["calories"],
    "calories_from_fat": ["calories from fat"],
    "cholesterol_mg": ["cholesterol"],
    "fiber_g": ["dietary fiber", "fiber"],
    "iron_mg": ["iron"],
    "potassium_mg": ["potassium"],
    "protein_g": ["protein"],
    "sat_fat_g": ["saturated fat", "sat fat"],
    "sodium_mg": ["sodium"],
    "sugar_g": ["sugars", "sugar", "total sugars"],
    "total_carbs_g": ["total carbohydrate", "total carbohydrates", "carbohydrates", "carbs"],
    "total_fat_g": ["total fat", "fat"],
    "trans_fat_g": ["trans fat"],
    "vitamin_c_mg": ["vitamin c"],
    "vitamin_d_mcg": ["vitamin d"],
}

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
]

HEX24 = r"[a-f0-9]{24}"

# Pre-validated Cal Poly DineOnCampus location IDs.
# Use these by default so production/CI runs do not depend on slow, brittle discovery.
KNOWN_CALPOLY_LOCATIONS = {
    "1901 Kitchen": "66bbafe2c625af0582e2bf84",
    "Balance Café": "68b87ec0b758aa2ffbefce7d",
    "Brunch": "64d5552d351d5305edbfb3e8",
    "Campus Market": "6525a669351d5306a1177d06",
    "Chick-fil-A": "659c29edc625af07f9dfe571",
    "CP Partners Pavilion": "6662080ee45d4307d241cbaa",
    "Einstein Bros. Bagels": "6440848ac625af079eb667be",
    "G. Brothers Taqueria - Lunch": "64e9246c351d53067ffdbc9d",
    "Grill at Campus Market": "689b735b0d4474603172a953",
    "Grubhub Robots": "6706a38ec625af0173152bac",
    "Health Shack": "64d67df0c625af06b2ab80db",
    "Hearth": "64d5552c351d5305edbfb3d6",
    "Hilltop": "649c5d53c625af06345771a1",
    "Jamba": "644080d9c625af07f4319dc2",
    "Jewel of India - Dinner": "64e91c16351d530693f676af",
    "Jewel of India - Lunch": "644085c7c625af080de6568a",
    "Julian's": "65b06964c625af0b9bc2e50f",
    "Julian's Library": "687eaf43ef69769fe7128d47",
    "Market at Grand Ave": "64ad9961e45d4367c97cf97b",
    "Mingle + Nosh": "64d5552d351d5305edbfb40a",
    "Noodles": "64d5552d351d5305edbfb3ed",
    "Panda Express": "659c2cc3e45d4308b4202efc",
    "Picos": "65b199c4c625af0ad308d398",
    "Plant Ivy - Dinner": "64e91b22351d53066bf88556",
    "Plant Ivy - Lunch": "644085d0c625af086b8960b9",
    "Poly Choice": "65b19b85c625af0abf21a76f",
    "Pom & Honey": "65b19831e45d4308ffa19f5c",
    "Red Radish": "65b0649ce45d43098ed6a75c",
    "Scout Coffee Co.": "644081afc625af078a0deee5",
    "Sequel": "687ea36d831b8cd0040de988",
    "Shake Smart": "6440825fc625af080de60c54",
    "Starbucks": "644082cac625af07c8eee340",
    "Streats": "64d5552c351d5305edbfb3dc",
    "Streats (Wed. Chef's Table)": "64d5035f351d5306009c9cb4",
    "Subway at Kennedy Library": "6440850dc625af07de8e08a2",
    "Subway at PCV": "6440855dc625af07b34e8999",
    "Taco Bell": "65428d15351d53063a1ff021",
    "The Deli at Market Grand Ave": "6499ed3ec625af065670cb22",
    "UU Market": "649b3022c625af062051f582",
    "Vista Grande Express": "64d6b253e45d430659d67b91",
    "Wednesday BBQ (at Campus Market Grill)": "66f6fa15e45d43013252108e",
    "What's Cookin' Kosher - Dinner": "64e91c66351d5306d2f151c1",
    "What's Cookin' Kosher - Lunch": "659c33dbe45d4308f6de890c",
}


@dataclass(frozen=True)
class Location:
    id: str
    name: str
    building: str = ""


class BrowserJsonFetcher:
    def __init__(self, base_url: str):
        try:
            from playwright.sync_api import sync_playwright  # type: ignore
        except Exception as exc:
            raise RuntimeError(
                "Playwright is not installed. Run `pip install playwright && python3 -m playwright install chromium`."
            ) from exc

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(headless=True)
        self._context = self._browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1440, "height": 1100},
        )
        self._page = self._context.new_page()
        self._base_url = base_url
        self._warm()

    def _warm(self) -> None:
        self._page.goto(self._base_url, wait_until="domcontentloaded", timeout=60000)
        self._page.wait_for_timeout(5000)

    def fetch_json(self, url: str, *, timeout_ms: int = 35000) -> Any:
        result = self._page.evaluate(
            """
            async ({ url, timeoutMs }) => {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), timeoutMs);
              try {
                const response = await fetch(url, {
                  method: "GET",
                  credentials: "include",
                  signal: controller.signal,
                  headers: {
                    "Accept": "application/json,text/plain,*/*",
                  },
                });
                const text = await response.text();
                return {
                  ok: response.ok,
                  status: response.status,
                  text,
                };
              } finally {
                clearTimeout(timer);
              }
            }
            """,
            {"url": url, "timeoutMs": timeout_ms},
        )
        if not result.get("ok"):
            raise RuntimeError(f"HTTP {result.get('status')}: {result.get('text', '')[:200]}")
        try:
            return json.loads(result.get("text") or "null")
        except Exception as exc:
            raise RuntimeError(f"Browser fetch returned non-JSON for {url}: {result.get('text', '')[:200]}") from exc

    def close(self) -> None:
        try:
            self._context.close()
        finally:
            try:
                self._browser.close()
            finally:
                self._playwright.stop()


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def make_session(base_url: str) -> requests.Session:
    if cloudscraper is not None:
        session = cloudscraper.create_scraper()
    else:
        session = requests.Session()
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else "https://dineoncampus.com"
    session.headers.update(
        {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json,text/plain,*/*",
            "Referer": base_url,
            "Origin": origin,
        }
    )
    return session


def request_json(
    session: requests.Session,
    url: str,
    *,
    retries: int = 3,
    sleep: float = 0.8,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> Any:
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=35)
            if resp.status_code in {403, 429, 500, 502, 503, 504}:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            last_exc = exc
            if browser_fetcher is not None and "HTTP 403" in str(exc):
                try:
                    return browser_fetcher.fetch_json(url)
                except Exception as browser_exc:
                    last_exc = browser_exc
            if attempt < retries - 1:
                time.sleep(sleep * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_exc}")




def request_json_probe(
    session: requests.Session,
    url: str,
    *,
    timeout: float = 3.0,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> Any:
    """Fast, single-attempt fetch used only while validating many candidate IDs."""
    resp = session.get(url, timeout=timeout)
    if resp.status_code in {403, 404, 429, 500, 502, 503, 504}:
        if browser_fetcher is not None and resp.status_code == 403:
            return browser_fetcher.fetch_json(url, timeout_ms=int(timeout * 1000))
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:120]}")
    resp.raise_for_status()
    return resp.json()


def request_text(session: requests.Session, url: str, *, retries: int = 2) -> str:
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=35, headers={"Accept": "text/html,application/javascript,text/plain,*/*"})
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            last_exc = exc
            if attempt < retries - 1:
                time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_exc}")


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(normalize_text(v) for v in value if normalize_text(v))
    if isinstance(value, dict):
        return normalize_text(value.get("name") or value.get("label") or value.get("title") or "")
    return re.sub(r"\s+", " ", str(value)).strip()


def numeric_or_blank(value: Any) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, (int, float)):
        return str(value)
    text = normalize_text(value)
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return match.group(0) if match else ""


def flatten_json(obj: Any) -> Iterable[dict[str, Any]]:
    if isinstance(obj, dict):
        yield obj
        for value in obj.values():
            yield from flatten_json(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from flatten_json(item)


def parse_location(raw: dict[str, Any]) -> Location | None:
    loc_id = raw.get("id") or raw.get("_id") or raw.get("location_id") or raw.get("locationId") or raw.get("uuid")
    name = raw.get("name") or raw.get("title") or raw.get("short_name") or raw.get("display_name")
    if not loc_id or not name:
        return None
    loc_id_s = str(loc_id)
    if not re.fullmatch(HEX24, loc_id_s, flags=re.I):
        return None
    building = raw.get("building") or raw.get("campus_name") or raw.get("address") or raw.get("description") or ""
    return Location(id=loc_id_s, name=normalize_text(name), building=normalize_text(building))


def unique_locations(locations: Iterable[Location]) -> list[Location]:
    by_id: dict[str, Location] = {}
    for loc in locations:
        if loc.id not in by_id:
            by_id[loc.id] = loc
        elif by_id[loc.id].name == loc.id and loc.name != loc.id:
            by_id[loc.id] = loc
    return sorted(by_id.values(), key=lambda l: l.name.lower())


def extract_locations_from_json(data: Any) -> list[Location]:
    """Extract menu-capable location objects from a DineOnCampus API response."""
    found: list[Location] = []

    if isinstance(data, dict):
        buildings = data.get("buildings")
        if isinstance(buildings, list):
            for building in buildings:
                if not isinstance(building, dict):
                    continue
                building_name = normalize_text(building.get("name"))
                for raw_loc in building.get("locations") or []:
                    if not isinstance(raw_loc, dict):
                        continue
                    loc = parse_location(raw_loc)
                    if loc:
                        # Keep the menu building name from the parent building object when available.
                        found.append(Location(id=loc.id, name=loc.name, building=building_name or loc.building))

        locations = data.get("locations") or data.get("records")
        if isinstance(locations, list):
            for raw_loc in locations:
                if isinstance(raw_loc, dict):
                    loc = parse_location(raw_loc)
                    if loc:
                        found.append(loc)

    for obj in flatten_json(data):
        loc = parse_location(obj)
        if loc:
            found.append(loc)

    # Only return locations likely to expose menus. Some API responses include buildings,
    # staff profiles, or other objects that also have 24-char ids.
    filtered = []
    for loc in found:
        # Keep webtrition/show_menus locations when we can infer them. If not present, do not over-filter.
        filtered.append(loc)
    return unique_locations(filtered)



def scrape_static_assets(session: requests.Session, base_url: str) -> list[tuple[str, str]]:
    """Return [(url, text)] for HTML and same-origin JS assets."""
    assets: list[tuple[str, str]] = []
    try:
        html = request_text(session, base_url)
    except Exception as exc:
        log(f"WARN could not fetch page HTML for discovery: {exc}")
        return assets
    assets.append((base_url, html))

    script_srcs = sorted(set(re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, flags=re.I)))
    for src in script_srcs:
        script_url = urljoin(base_url, src)
        # Skip obvious third-party analytics.
        if "dineoncampus" not in script_url and urlparse(script_url).netloc not in {"", urlparse(base_url).netloc}:
            continue
        try:
            assets.append((script_url, request_text(session, script_url)))
        except Exception:
            continue
    return assets


def discover_site_id_from_assets(assets: list[tuple[str, str]]) -> str | None:
    patterns = [
        rf"site_id[\"']?\s*[:=]\s*[\"']({HEX24})[\"']",
        rf"siteId[\"']?\s*[:=]\s*[\"']({HEX24})[\"']",
        rf"siteId=({HEX24})",
        rf"site_id=({HEX24})",
        rf"/sites?/({HEX24})",
    ]
    for _, text in assets:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.I)
            if match:
                return match.group(1)
    return None


def candidate_location_ids_from_text(text: str) -> list[str]:
    ids: set[str] = set()
    patterns = [
        rf"api\.dineoncampus\.com/v1/location/({HEX24})",
        rf"/v1/location/({HEX24})",
        rf"location_id[\"']?\s*[:=]\s*[\"']({HEX24})[\"']",
        rf"locationId[\"']?\s*[:=]\s*[\"']({HEX24})[\"']",
    ]
    for pattern in patterns:
        ids.update(m.group(1) for m in re.finditer(pattern, text, flags=re.I))
    return sorted(ids)


def discover_locations_from_assets(assets: list[tuple[str, str]]) -> list[Location]:
    locations: list[Location] = []
    raw_ids: set[str] = set()
    for _, text in assets:
        raw_ids.update(candidate_location_ids_from_text(text))
        # Also inspect embedded JSON-ish objects. This catches route payloads that contain
        # {id/name} pairs without explicit API URLs.
        for loc_id in sorted(set(re.findall(HEX24, text, flags=re.I))):
            window_start = max(0, text.find(loc_id) - 500)
            window_end = min(len(text), text.find(loc_id) + 500)
            window = text[window_start:window_end]
            if re.search(r"location|dining|market|cafe|restaurant|venue", window, flags=re.I):
                raw_ids.add(loc_id)
    locations.extend(Location(id=i, name=i) for i in raw_ids)
    return unique_locations(locations)


def discover_locations_from_api(
    session: requests.Session,
    site_id: str | None,
    date: dt.date,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> list[Location]:
    if not site_id:
        return []
    date_s = date.isoformat()
    candidates = [
        # Documented endpoint for menu-capable locations.
        f"{BASE_API_URL}/locations/all_locations?platform=0&site_id={site_id}&for_menus=true&with_address=false&with_buildings=true",
        f"{BASE_API_URL}/locations/all?site_id={site_id}&platform=0",
        f"{BASE_API_URL}/locations?site_id={site_id}&platform=0",
        f"{BASE_API_URL}/locations/status?site_id={site_id}&platform=0&date={date_s}",
        f"{BASE_API_URL}/locations/weekly_schedule?site_id={site_id}&platform=0&date={date_s}",
        f"{BASE_API_URL}/site/{site_id}/locations?platform=0",
        f"{BASE_API_URL}/sites/{site_id}/locations?platform=0",
    ]
    for url in candidates:
        try:
            data = request_json(session, url, browser_fetcher=browser_fetcher)
        except Exception as exc:
            log(f"  discovery endpoint failed: {url} ({exc})")
            continue
        found = extract_locations_from_json(data)
        if found:
            log(f"Found locations from {url}")
            return found
    return []


def probe_menu_locations(
    session: requests.Session,
    locations: list[Location],
    date: dt.date,
    max_locations: int = 500,
    workers: int = 24,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> list[Location]:
    """Filter candidate ids down to real menu locations.

    Browser discovery can surface hundreds of unrelated 24-char IDs. The earlier
    version validated only the first 35, which is why Cal Poly only discovered
    1901 Kitchen. This version probes all candidates concurrently using short
    single-attempt requests, so it is still CI-friendly but does not miss valid
    locations later in the candidate list.
    """
    date_s = date.isoformat()
    candidates = unique_locations(locations)[:max_locations]
    if len(locations) > max_locations:
        log(f"Validating first {max_locations} of {len(locations)} candidates. Increase --max-candidates if needed.")
    else:
        log(f"Validating {len(candidates)} candidates concurrently...")

    def probe_one(loc: Location) -> Location | None:
        # apiv4 is the current endpoint shape for Cal Poly. v1 fallback is kept
        # for other schools / older deployments.
        urls = [
            f"{APIV4_URL}/locations/{loc.id}/periods?platform=0&date={date_s}",
            f"{BASE_API_URL}/location/{loc.id}/periods?platform=0&date={date_s}",
        ]
        for url in urls:
            try:
                data = request_json_probe(
                    session,
                    url,
                    timeout=3.0,
                    browser_fetcher=browser_fetcher,
                )
                periods = data.get("periods", []) if isinstance(data, dict) else []
                if periods:
                    return loc
            except Exception:
                continue
        return None

    valid: list[Location] = []
    done = 0
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = [executor.submit(probe_one, loc) for loc in candidates]
        for future in as_completed(futures):
            done += 1
            if done == 1 or done % 25 == 0 or done == len(futures):
                log(f"  probed {done}/{len(futures)} candidates; valid so far: {len(valid)}")
            try:
                loc = future.result()
            except Exception:
                loc = None
            if loc is not None:
                valid.append(loc)

    valid = unique_locations(valid)
    if valid:
        log("Validated menu locations:")
        for loc in valid:
            log(f"  - {loc.name} = {loc.id}")
    return valid

def discover_locations_with_browser(base_url: str, seconds: int = 18) -> list[Location]:
    """Playwright discovery. Captures API response bodies, not just URLs.

    DineOnCampus often hides the useful 24-char Mongo IDs inside XHR/JSON
    responses after the React app boots. The old version only inspected request
    URLs, which misses Cal Poly. This version reads JSON response bodies too.
    """
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "Playwright is not installed. Run `pip install playwright && python3 -m playwright install chromium`."
        ) from exc

    ids: set[str] = set()
    locations: list[Location] = []

    def ingest_text(text: str) -> None:
        ids.update(candidate_location_ids_from_text(text))
        # Keep only ids that appear near location/menu words to avoid grabbing
        # unrelated asset ids, image ids, tracking ids, etc.
        for match in re.finditer(HEX24, text, flags=re.I):
            loc_id = match.group(0)
            window = text[max(0, match.start() - 700): min(len(text), match.end() + 700)]
            if re.search(r"location|locations|dining|menu|menus|webtrition|restaurant|venue|market|cafe|food", window, flags=re.I):
                ids.add(loc_id)

    def ingest_json(data: Any) -> None:
        locations.extend(extract_locations_from_json(data))
        try:
            ingest_text(json.dumps(data))
        except Exception:
            pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1440, "height": 1100},
        )
        page = context.new_page()

        def handle_request(req: Any) -> None:
            try:
                ingest_text(req.url)
            except Exception:
                pass

        def handle_response(res: Any) -> None:
            try:
                url = res.url
                ingest_text(url)
                ctype = (res.headers or {}).get("content-type", "")
                # API responses may be JSON but not always labeled perfectly.
                if "api" in url or "json" in ctype or "dineoncampus" in url:
                    try:
                        ingest_json(res.json())
                    except Exception:
                        try:
                            body = res.text()
                            if body:
                                ingest_text(body)
                                if body.lstrip().startswith(("{", "[")):
                                    ingest_json(json.loads(body))
                        except Exception:
                            pass
            except Exception:
                pass

        page.on("request", handle_request)
        page.on("response", handle_response)

        page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)

        # Scroll to lazy-load cards/API calls.
        for _ in range(4):
            try:
                page.mouse.wheel(0, 900)
                page.wait_for_timeout(800)
            except Exception:
                break

        # Try obvious nav/actions. This is intentionally conservative: the goal
        # is to trigger API calls, not scrape visible text.
        selectors = [
            "a[href*='menu']",
            "a[href*='menus']",
            "a[href*='location']",
            "a[href*='campus-map']",
            "text=/menu/i",
            "text=/what.*open/i",
            "text=/locations/i",
            "button",
            "[role=button]",
        ]
        deadline = time.time() + seconds
        for selector in selectors:
            if time.time() > deadline:
                break
            try:
                locators = page.locator(selector)
                count = min(locators.count(), 25)
                for idx in range(count):
                    if time.time() > deadline:
                        break
                    try:
                        target = locators.nth(idx)
                        if not target.is_visible(timeout=500):
                            continue
                        target.click(timeout=1200)
                        page.wait_for_timeout(1000)
                    except Exception:
                        continue
            except Exception:
                continue

        # Last pass over rendered HTML.
        try:
            ingest_text(page.content())
        except Exception:
            pass
        browser.close()

    locations.extend(Location(id=i, name=i) for i in ids)
    return unique_locations(locations)


def parse_location_args(values: list[str]) -> list[Location]:
    locations: list[Location] = []
    for value in values:
        if "=" in value:
            name, loc_id = value.split("=", 1)
        else:
            name, loc_id = value, value
        loc_id = loc_id.strip()
        if not re.fullmatch(HEX24, loc_id, flags=re.I):
            raise SystemExit(f"Invalid --location value {value!r}; expected NAME=<24 hex location id>.")
        locations.append(Location(id=loc_id, name=normalize_text(name) or loc_id))
    return locations


def get_locations(
    session: requests.Session,
    *,
    base_url: str,
    site_id: str | None,
    start_date: dt.date,
    browser_discovery: bool,
    manual_locations: list[Location],
    max_candidates: int,
    probe_workers: int,
    force_discovery: bool = False,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> list[Location]:
    if manual_locations:
        return unique_locations(manual_locations)

    if not force_discovery and "dineoncampus.com/calpoly" in base_url.lower():
        log(f"Using {len(KNOWN_CALPOLY_LOCATIONS)} pre-validated Cal Poly locations.")
        return [Location(id=loc_id, name=name) for name, loc_id in KNOWN_CALPOLY_LOCATIONS.items()]

    assets = scrape_static_assets(session, base_url)
    if not site_id:
        site_id = discover_site_id_from_assets(assets)
        if site_id:
            log(f"Discovered site_id={site_id}")

    locations = discover_locations_from_api(
        session,
        site_id,
        start_date,
        browser_fetcher=browser_fetcher,
    )
    if locations:
        return locations

    locations = discover_locations_from_assets(assets)
    if locations:
        log(f"Discovered {len(locations)} candidate location IDs from page assets; validating menu endpoints...")
        valid_locations = probe_menu_locations(
            session,
            locations,
            start_date,
            max_locations=max_candidates,
            workers=probe_workers,
            browser_fetcher=browser_fetcher,
        )
        if valid_locations:
            log(f"Validated {len(valid_locations)} menu-capable locations from page assets.")
            return valid_locations
        log("WARN: page asset IDs did not validate as menu locations.")

    # For --url usage, auto-fallback to browser discovery when Playwright is
    # installed. This makes `python3 scrape_calpoly_dining.py --url ...` work
    # without forcing the user to know internal ids. If Playwright is missing,
    # the error clearly explains the install command.
    if browser_discovery or not site_id:
        log("Trying browser-based location discovery...")
        try:
            locations = discover_locations_with_browser(base_url)
        except Exception as exc:
            raise RuntimeError(
                "Could not discover DineOnCampus locations using direct HTTP, and browser discovery failed.\n"
                f"Browser discovery error: {exc}\n"
                "Install browser support with:\n"
                "  pip install playwright\n"
                "  python3 -m playwright install chromium\n"
                "Then rerun:\n"
                f"  python3 {Path(sys.argv[0]).name} --url {base_url} --browser-discovery"
            ) from exc

        if locations:
            log(f"Browser found {len(locations)} candidate locations; validating menu endpoints...")
            valid_locations = probe_menu_locations(
                session,
                locations,
                start_date,
                max_locations=max_candidates,
                workers=probe_workers,
                browser_fetcher=browser_fetcher,
            )
            if valid_locations:
                log(f"Validated {len(valid_locations)} browser-discovered menu locations.")
                return valid_locations
            log("WARN: Browser found IDs, but none validated against known menu endpoints.")
            log("Returning candidates anyway so period/menu warnings reveal which endpoint shape is failing.")
            return locations

    raise RuntimeError(
        "Could not discover DineOnCampus locations. Try rerunning with --browser-discovery, "
        "or pass known IDs using --location 'Name=LOCATION_ID'."
    )


def get_periods(
    session: requests.Session,
    location_id: str,
    date: str,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> list[dict[str, Any]]:
    urls = [
        f"{APIV4_URL}/locations/{location_id}/periods?platform=0&date={date}",
        f"{BASE_API_URL}/location/{location_id}/periods?platform=0&date={date}",
    ]
    last_error = None
    for url in urls:
        try:
            data = request_json(session, url, browser_fetcher=browser_fetcher)
            periods = data.get("periods", []) if isinstance(data, dict) else []
            return [p for p in periods if isinstance(p, dict) and p.get("id")]
        except Exception as exc:
            last_error = exc
    raise RuntimeError(f"Could not fetch periods for {location_id}: {last_error}")


def get_menu_for_period(
    session: requests.Session,
    location_id: str,
    period_id: str,
    date: str,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> dict[str, Any]:
    urls = [
        f"{APIV4_URL}/locations/{location_id}/menu?date={date}&period={period_id}",
        f"{BASE_API_URL}/location/{location_id}/periods/{period_id}?platform=0&date={date}",
    ]
    last_error = None
    for url in urls:
        try:
            data = request_json(session, url, browser_fetcher=browser_fetcher)
            return data if isinstance(data, dict) else {}
        except Exception as exc:
            last_error = exc
    raise RuntimeError(f"Could not fetch menu for {location_id} / {period_id}: {last_error}")


def name_location_from_periods(
    session: requests.Session,
    location: Location,
    date_s: str,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> Location:
    if location.name != location.id:
        return location
    # API periods response sometimes includes location info. Best-effort naming.
    try:
        data = request_json(
            session,
            f"{BASE_API_URL}/location/{location.id}/periods?platform=0&date={date_s}",
            browser_fetcher=browser_fetcher,
        )
        for obj in flatten_json(data):
            loc = parse_location(obj)
            if loc and loc.id == location.id and loc.name != location.id:
                return loc
    except Exception:
        pass
    return location


def nutrient_map(item: dict[str, Any]) -> dict[str, str]:
    out = {col: "" for col in NUTRIENT_ALIASES}
    if item.get("calories") not in (None, ""):
        out["calories"] = numeric_or_blank(item.get("calories"))

    nutrients = item.get("nutrients") or []
    if isinstance(nutrients, dict):
        nutrients = list(nutrients.values())

    for nutrient in nutrients:
        if not isinstance(nutrient, dict):
            continue
        name = normalize_text(nutrient.get("name") or nutrient.get("label")).lower()
        value = nutrient.get("value_numeric", nutrient.get("value", nutrient.get("amount")))
        for column, aliases in NUTRIENT_ALIASES.items():
            if any(alias == name or alias in name for alias in aliases):
                out[column] = numeric_or_blank(value)
                break
    return out


def filters_by_type(item: dict[str, Any], wanted_type: str) -> list[str]:
    filters = item.get("filters") or []
    values: list[str] = []
    for filt in filters:
        if not isinstance(filt, dict):
            continue
        ftype = normalize_text(filt.get("type")).lower()
        name = normalize_text(filt.get("name"))
        if name and ftype == wanted_type:
            values.append(name)
    return sorted(set(values))


def iter_categories(menu_json: dict[str, Any]) -> Iterable[dict[str, Any]]:
    maybe_paths = [
        menu_json.get("menu", {}).get("periods", {}).get("categories"),
        menu_json.get("period", {}).get("categories"),
        menu_json.get("periods", {}).get("categories"),
        menu_json.get("categories"),
    ]
    for categories in maybe_paths:
        if isinstance(categories, list):
            yield from (c for c in categories if isinstance(c, dict))
            return


def row_from_item(*, date: dt.date, location: Location, meal_period: str, station: str, item: dict[str, Any]) -> dict[str, str]:
    nutrients = nutrient_map(item)
    allergens = filters_by_type(item, "allergen")
    labels = filters_by_type(item, "label")
    row = {
        "date": date.isoformat(),
        "day_of_week": date.strftime("%A"),
        "location": location.name,
        "building": location.building,
        "meal_period": normalize_text(meal_period),
        "station": normalize_text(station),
        "item_name": normalize_text(item.get("name") or item.get("label")),
        "item_id": normalize_text(item.get("id") or item.get("_id") or item.get("menu_item_id")),
        "portion": normalize_text(item.get("portion") or "—"),
        "description": normalize_text(item.get("desc") or item.get("description")),
        "ingredients": normalize_text(item.get("ingredients")),
        "allergens": ", ".join(allergens),
        "dietary_labels": ", ".join(labels),
    }
    row.update(nutrients)
    return {col: row.get(col, "") for col in CSV_COLUMNS}


def scrape_week(
    session: requests.Session,
    locations: list[Location],
    start_date: dt.date,
    days: int,
    throttle: float,
    browser_fetcher: BrowserJsonFetcher | None = None,
) -> list[dict[str, str]]:
    log(f"Found {len(locations)} locations.")
    rows: list[dict[str, str]] = []

    for day_offset in range(days):
        date = start_date + dt.timedelta(days=day_offset)
        date_s = date.isoformat()
        log(f"Scraping {date_s}...")

        for original_location in locations:
            location = name_location_from_periods(
                session,
                original_location,
                date_s,
                browser_fetcher=browser_fetcher,
            )
            try:
                periods = get_periods(
                    session,
                    location.id,
                    date_s,
                    browser_fetcher=browser_fetcher,
                )
            except Exception as exc:
                log(f"  WARN periods failed for {location.name}: {exc}")
                continue

            for period in periods:
                period_id = str(period.get("id"))
                period_name = normalize_text(period.get("name") or period.get("label"))
                try:
                    menu_json = get_menu_for_period(
                        session,
                        location.id,
                        period_id,
                        date_s,
                        browser_fetcher=browser_fetcher,
                    )
                except Exception as exc:
                    log(f"  WARN menu failed for {location.name} / {period_name}: {exc}")
                    continue

                for category in iter_categories(menu_json):
                    station = normalize_text(category.get("name") or category.get("label") or "")
                    items = category.get("items") or []
                    if not isinstance(items, list):
                        continue
                    for item in items:
                        if isinstance(item, dict) and normalize_text(item.get("name") or item.get("label")):
                            rows.append(row_from_item(date=date, location=location, meal_period=period_name, station=station, item=item))
                time.sleep(throttle)
    return rows


def default_start_date() -> dt.date:
    today = dt.date.today()
    return today - dt.timedelta(days=today.weekday())


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Cal Poly DineOnCampus menus into a BiteCheck CSV.")
    parser.add_argument("--url", default=os.getenv("DINEONCAMPUS_URL", DEFAULT_CALPOLY_URL), help="DineOnCampus school URL. Default: Cal Poly.")
    parser.add_argument("--site-id", default=os.getenv("DINEONCAMPUS_SITE_ID"), help="Optional DineOnCampus site_id override.")
    parser.add_argument("--location", action="append", default=[], help="Manual location override as 'Name=LOCATION_ID'. Can be repeated.")
    parser.add_argument("--browser-discovery", action="store_true", help="Use Playwright to discover location IDs if HTTP discovery fails.")
    parser.add_argument(
        "--browser-http-fallback",
        action="store_true",
        help="Use Playwright-backed fetches when DineOnCampus blocks direct API requests with Cloudflare.",
    )
    parser.add_argument("--force-discovery", action="store_true", help="Ignore built-in Cal Poly location IDs and rediscover from the site.")
    parser.add_argument("--max-candidates", type=int, default=500, help="Max discovered candidate IDs to validate. Default: 500.")
    parser.add_argument("--probe-workers", type=int, default=24, help="Concurrent probe workers for candidate validation. Default: 24.")
    parser.add_argument("--start-date", default=None, help="First date to scrape, YYYY-MM-DD. Defaults to current Monday.")
    parser.add_argument("--days", type=int, default=7, help="Number of days to scrape. Default: 7.")
    parser.add_argument("--out", default=None, help="Output CSV path. Defaults to calpoly_menu_START_to_END.csv")
    parser.add_argument("--throttle", type=float, default=0.35, help="Delay between period requests. Default: 0.35s")
    args = parser.parse_args()

    start = dt.date.fromisoformat(args.start_date) if args.start_date else default_start_date()
    end = start + dt.timedelta(days=args.days - 1)
    out_path = Path(args.out or f"calpoly_menu_{start.isoformat()}_to_{end.isoformat()}.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    session = make_session(args.url)
    browser_fetcher = BrowserJsonFetcher(args.url) if args.browser_http_fallback else None

    try:
        manual_locations = parse_location_args(args.location)
        locations = get_locations(
            session,
            base_url=args.url,
            site_id=args.site_id,
            start_date=start,
            browser_discovery=args.browser_discovery,
            manual_locations=manual_locations,
            max_candidates=args.max_candidates,
            probe_workers=args.probe_workers,
            force_discovery=args.force_discovery,
            browser_fetcher=browser_fetcher,
        )

        rows = scrape_week(
            session,
            locations,
            start,
            args.days,
            args.throttle,
            browser_fetcher=browser_fetcher,
        )
        rows.sort(key=lambda r: (r["date"], r["location"], r["meal_period"], r["station"], r["item_name"]))

        with out_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            writer.writeheader()
            writer.writerows(rows)

        log(f"Wrote {len(rows)} rows to {out_path}")
        if len(rows) == 0:
            log("WARN: CSV was created but no menu rows were found. Try --browser-discovery, or pass a known location with --location NAME=LOCATION_ID.")
    finally:
        if browser_fetcher is not None:
            browser_fetcher.close()


if __name__ == "__main__":
    main()
