import requests
from bs4 import BeautifulSoup
import json
import re
import time

def scrape_vessel(vessel_url):
    """Scrape a single vessel page for all details"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(vessel_url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        vessel_data = {
            'vessel_name': '',
            'IMO': '',
            'MMSI': '',
            'flag': '',
            'vessel_type': '',
            'category': '',
            'vessel_photo_url': '',
            'sanctions': [],
            'vessel_information': ''
        }

        # Extract vessel photo
        img = soup.find('img', src=lambda x: x and ('/uploads/' in x or '/media/' in x))
        if img:
            photo_url = img.get('src', '')
            if photo_url and not photo_url.startswith('http'):
                vessel_data['vessel_photo_url'] = f"https://war-sanctions.gur.gov.ua{photo_url}"
            else:
                vessel_data['vessel_photo_url'] = photo_url

        # Get page text for parsing
        page_text = soup.get_text()

        # Extract vessel name - improved pattern
        name_match = re.search(r'Vessel\s*name\s*([A-Z0-9\s\-\.]+?)(?=Category|IMO)', page_text, re.IGNORECASE)
        if name_match:
            vessel_data['vessel_name'] = name_match.group(1).strip()

        # Extract IMO
        imo_match = re.search(r'IMO\s*(\d+)', page_text)
        if imo_match:
            vessel_data['IMO'] = imo_match.group(1).strip()

        # Extract MMSI
        mmsi_match = re.search(r'MMSI\s*(\d+)', page_text)
        if mmsi_match:
            vessel_data['MMSI'] = mmsi_match.group(1).strip()

        # Extract flag - improved pattern
        flag_match = re.search(r'Flag\s*\(Current\)\s*([A-Za-z\s]+?)(?=MMSI|Vessel\s*Type|Call)', page_text)
        if flag_match:
            vessel_data['flag'] = flag_match.group(1).strip()

        # Extract vessel type - improved pattern
        type_match = re.search(r'Vessel\s*Type\s*([A-Za-z\s/\-]+?)(?=Length|Gross|DWT|P&I)', page_text)
        if type_match:
            vessel_data['vessel_type'] = type_match.group(1).strip()

        # Extract category - get both lines
        category_match = re.search(r'Category\s*(.+?)(?=IMO|Flag|MMSI)', page_text, re.DOTALL)
        if category_match:
            category_text = category_match.group(1).strip()
            # Clean up - remove extra whitespace and combine lines
            category_lines = [line.strip() for line in category_text.split('\n') if line.strip() and len(line.strip()) > 5]
            # Join unique lines
            unique_cats = []
            for line in category_lines:
                if line not in unique_cats and not line.startswith(('The ', 'On ', 'In ', 'From ', 'Since ')):
                    unique_cats.append(line)
            vessel_data['category'] = ' → '.join(unique_cats[:2]) if len(unique_cats) > 1 else (unique_cats[0] if unique_cats else '')

        # Extract vessel information - look for the justification section
        info_match = re.search(r'(?:Justification|Vessel information)\s*(.+?)(?=Cases of AIS|Visited ports|Available additional|Web Resources|Go to site|$)', page_text, re.DOTALL)
        if info_match:
            vessel_data['vessel_information'] = info_match.group(1).strip()

        # Extract sanctions - more comprehensive
        sanctions = []
        # Find all sanction mentions
        sanction_sentences = re.finditer(
            r'(?:On|From|Since|In)\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4},?\s+(?:the\s+)?([A-Z][A-Za-z\s,]+?)\s+(?:imposed|introduced|applied)\s+sanctions[^\.]*\.',
            page_text,
            re.IGNORECASE
        )

        for match in sanction_sentences:
            sanction_text = match.group(0).strip()
            if sanction_text and sanction_text not in sanctions:
                sanctions.append(sanction_text)

        vessel_data['sanctions'] = sanctions

        return vessel_data

    except Exception as e:
        print(f"Error scraping vessel {vessel_url}: {e}")
        return None


def get_vessel_list_from_web():
    """Fetch vessel list directly from the website"""
    vessels = []
    base_url = "https://war-sanctions.gur.gov.ua/en/transport/shadow-fleet"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    page = 1
    max_pages = 55

    while page <= max_pages:
        try:
            url = f"{base_url}?page={page}" if page > 1 else base_url
            print(f"Fetching vessel list page {page}/{max_pages}...")
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            vessel_links = soup.find_all('a', href=lambda x: x and '/shadow-fleet/' in x and x != '/en/transport/shadow-fleet')

            found_vessels = 0
            for link in vessel_links:
                vessel_url = link.get('href')
                if '?page=' in vessel_url:
                    continue
                if not vessel_url.startswith('http'):
                    vessel_url = f"https://war-sanctions.gur.gov.ua{vessel_url}"
                if vessel_url not in [v['url'] for v in vessels]:
                    vessel_id = vessel_url.split('/')[-1]
                    vessels.append({
                        'id': vessel_id,
                        'url': vessel_url
                    })
                    found_vessels += 1

            print(f"  Found {found_vessels} new vessels on page {page} (Total: {len(vessels)})")

            if found_vessels == 0:
                print(f"No more vessels found. Stopping at page {page}.")
                break

            page += 1
            time.sleep(1)
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break

    return vessels

def resume_scraping():
    """Resume scraping from where we left off"""

    # Fetch the full vessel list from web
    print("Fetching vessel list from website...")
    all_vessels = get_vessel_list_from_web()

    # Load already scraped vessels
    print("Loading already scraped vessels...")
    try:
        with open('shadow_fleet.json', 'r', encoding='utf-8') as f:
            scraped_vessels = json.load(f)
    except FileNotFoundError:
        scraped_vessels = []

    # Get list of already scraped vessel IDs
    scraped_ids = set()
    for vessel in scraped_vessels:
        # Try to find ID from vessel data
        if 'IMO' in vessel and vessel['IMO']:
            scraped_ids.add(vessel['IMO'])

    # Also check which vessel IDs we've already attempted (from URL if available)
    scraped_urls = set()
    for i, vessel in enumerate(all_vessels):
        if i < len(scraped_vessels):
            scraped_urls.add(vessel['url'])

    print(f"Already scraped: {len(scraped_vessels)} vessels")
    print(f"Total vessels: {len(all_vessels)}")

    # Find vessels that need to be scraped
    remaining = []
    for vessel in all_vessels:
        # Check if we haven't scraped this URL yet
        if vessel['url'] not in scraped_urls:
            remaining.append(vessel)

    print(f"Remaining to scrape: {len(remaining)} vessels")

    if not remaining:
        print("All vessels already scraped!")
        return

    # Start scraping remaining vessels
    failed = []
    new_vessels = []

    for i, vessel_info in enumerate(remaining):
        vessel_url = vessel_info['url']
        vessel_id = vessel_info['id']

        print(f"\n[{i+1}/{len(remaining)}] Scraping vessel {vessel_id}...")

        vessel_data = scrape_vessel(vessel_url)

        if vessel_data:
            new_vessels.append(vessel_data)
            print(f"  ✓ {vessel_data.get('vessel_name', 'Unknown')} - IMO: {vessel_data.get('IMO', 'N/A')}")
        else:
            failed.append(vessel_url)
            print(f"  ✗ Failed to scrape")

        # Save progress every 50 vessels
        if (i + 1) % 50 == 0:
            print(f"\n>>> Saving progress ({len(scraped_vessels) + len(new_vessels)} total vessels)...")
            combined = scraped_vessels + new_vessels
            with open('shadow_fleet.json', 'w', encoding='utf-8') as f:
                json.dump(combined, f, ensure_ascii=False, indent=2)

        # Rate limiting - be respectful
        if i < len(remaining) - 1:
            time.sleep(1.5)

    # Final save
    print("\n>>> Saving final data...")
    combined = scraped_vessels + new_vessels
    with open('shadow_fleet.json', 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Successfully scraped {len(new_vessels)} new vessels")
    print(f"✓ Total vessels now: {len(combined)}")
    print(f"✗ Failed to scrape {len(failed)} vessels")

    if failed:
        print("\nFailed URLs:")
        for url in failed[:10]:  # Show first 10
            print(f"  - {url}")
        if len(failed) > 10:
            print(f"  ... and {len(failed) - 10} more")


if __name__ == "__main__":
    resume_scraping()
