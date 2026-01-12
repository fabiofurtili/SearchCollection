import json
from playwright.sync_api import sync_playwright

MARKET_URL = "https://mudream.online/pt/market"

def fetch_market_items():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(MARKET_URL, timeout=60000)
        page.wait_for_timeout(5000)

        html = page.content()
        browser.close()

    # ⚠️ por enquanto mock
    return [
        {
            "name": "Sword of Destruction",
            "level": 11,
            "price": 2500,
            "options": {
                "skill": True,
                "luck": True,
                "excellent": True,
                "ancient": False
            }
        }
    ]

if __name__ == "__main__":
    items = fetch_market_items()
    print(json.dumps(items))
