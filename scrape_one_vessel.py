import requests
from bs4 import BeautifulSoup
import json
import re

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
        print(f"Error scraping vessel: {e}")
        return None

if __name__ == "__main__":
    # Scrape the first vessel (SAURI)
    vessel_url = "https://war-sanctions.gur.gov.ua/en/transport/shadow-fleet/804"

    print(f"Scraping vessel from {vessel_url}...")
    vessel_data = scrape_vessel(vessel_url)

    if vessel_data:
        # Save to shadow_fleet.json
        with open('shadow_fleet.json', 'w', encoding='utf-8') as f:
            json.dump([vessel_data], f, ensure_ascii=False, indent=2)

        print("\nVessel data scraped successfully!")
        print(f"Vessel Name: {vessel_data['vessel_name']}")
        print(f"IMO: {vessel_data['IMO']}")
        print(f"MMSI: {vessel_data['MMSI']}")
        print(f"Flag: {vessel_data['flag']}")
        print(f"Type: {vessel_data['vessel_type']}")
        print(f"Photo URL: {vessel_data['vessel_photo_url']}")
        print(f"\nData saved to shadow_fleet.json")
    else:
        print("Failed to scrape vessel data")
