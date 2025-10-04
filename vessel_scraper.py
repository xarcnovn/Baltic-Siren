import requests
from bs4 import BeautifulSoup
import json
import time
from typing import List, Dict

class VesselScraper:
    def __init__(self):
        self.base_url = "https://war-sanctions.gur.gov.ua/en/transport/shadow-fleet"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def get_vessel_list(self, max_pages: int = 55) -> List[Dict]:
        """Scrape the main page to get all vessel links"""
        vessels = []
        page = 1

        while page <= max_pages:
            try:
                url = f"{self.base_url}?page={page}" if page > 1 else self.base_url
                print(f"Fetching page {page}/{max_pages}...")
                response = requests.get(url, headers=self.headers, timeout=30)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')

                # Find all vessel links
                vessel_links = soup.find_all('a', href=lambda x: x and '/shadow-fleet/' in x and x != '/en/transport/shadow-fleet')

                # Filter out pagination and other non-vessel links
                found_vessels = 0
                for link in vessel_links:
                    vessel_url = link.get('href')

                    # Skip pagination links
                    if '?page=' in vessel_url:
                        continue

                    if not vessel_url.startswith('http'):
                        vessel_url = f"https://war-sanctions.gur.gov.ua{vessel_url}"

                    # Avoid duplicates
                    if vessel_url not in [v['url'] for v in vessels]:
                        vessel_id = vessel_url.split('/')[-1]

                        # Try to extract basic info from listing
                        vessel_details = link.find('div', class_='vessel-details')
                        if vessel_details:
                            text = vessel_details.get_text(strip=True)
                        else:
                            text = link.get_text(strip=True)

                        vessels.append({
                            'id': vessel_id,
                            'url': vessel_url,
                            'preview': text
                        })
                        found_vessels += 1

                print(f"  Found {found_vessels} new vessels on page {page} (Total: {len(vessels)})")

                # If no vessels found on this page, we've reached the end
                if found_vessels == 0:
                    print(f"No more vessels found. Stopping at page {page}.")
                    break

                page += 1
                time.sleep(1)  # Be respectful with pagination

            except Exception as e:
                print(f"Error fetching page {page}: {e}")
                break

        return vessels

    def get_vessel_details(self, vessel_url: str) -> Dict:
        """Scrape individual vessel page for detailed information"""
        try:
            response = requests.get(vessel_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract vessel details
            vessel_data = {
                'url': vessel_url,
                'name': '',
                'imo': '',
                'mmsi': '',
                'flag': '',
                'vessel_type': '',
                'category': '',
                'sanctions': [],
                'description': ''
            }

            # Extract structured data
            details = soup.find_all(['dt', 'dd', 'p', 'div'])
            text_content = soup.get_text()

            # Try to find specific fields
            for elem in details:
                text = elem.get_text(strip=True)
                if 'Vessel name:' in text or 'Name:' in text:
                    vessel_data['name'] = text.split(':')[-1].strip()
                elif 'IMO:' in text:
                    vessel_data['imo'] = text.split(':')[-1].strip()
                elif 'MMSI:' in text:
                    vessel_data['mmsi'] = text.split(':')[-1].strip()
                elif 'Flag:' in text:
                    vessel_data['flag'] = text.split(':')[-1].strip()
                elif 'Vessel Type:' in text or 'Type:' in text:
                    vessel_data['vessel_type'] = text.split(':')[-1].strip()
                elif 'Category:' in text:
                    vessel_data['category'] = text.split(':')[-1].strip()

            # Get title as fallback for name
            if not vessel_data['name']:
                title = soup.find('h1')
                if title:
                    vessel_data['name'] = title.get_text(strip=True)

            # Get main content/description
            content = soup.find('div', class_=['content', 'description', 'main-content'])
            if content:
                vessel_data['description'] = content.get_text(strip=True)

            return vessel_data
        except Exception as e:
            print(f"Error fetching vessel details from {vessel_url}: {e}")
            return {'url': vessel_url, 'error': str(e)}

    def scrape_all(self, delay: float = 2.0) -> List[Dict]:
        """Scrape all vessels with rate limiting"""
        print("Fetching vessel list...")
        vessels = self.get_vessel_list()
        print(f"Found {len(vessels)} vessels")

        detailed_vessels = []
        for i, vessel in enumerate(vessels):
            print(f"Scraping vessel {i+1}/{len(vessels)}: {vessel['url']}")
            details = self.get_vessel_details(vessel['url'])
            detailed_vessels.append(details)

            # Rate limiting to be respectful
            time.sleep(delay)

        return detailed_vessels

    def save_to_json(self, vessels: List[Dict], filename: str = 'vessels.json'):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(vessels, f, ensure_ascii=False, indent=2)
        print(f"Data saved to {filename}")


# Usage
if __name__ == "__main__":
    scraper = VesselScraper()

    # Just get the vessel list first (faster)
    vessels = scraper.get_vessel_list()

    # Save vessel list
    scraper.save_to_json(vessels, 'vessel_list.json')

    print(f"\nFound {len(vessels)} vessels!")
    print("\nFirst few vessels:")
    for v in vessels[:5]:
        print(f"  - {v['id']}: {v['url']}")

    # Uncomment below to scrape full details (will take longer)
    # print("\nTo scrape full details, uncomment the lines below")
    # detailed_vessels = scraper.scrape_all(delay=2.0)
    # scraper.save_to_json(detailed_vessels, 'vessels_detailed.json')
