#!/usr/bin/env python3
"""
check_affiliate_links.py
InfoSecDeck — WAT Framework Tool

Scans index.html and js/app.js for affiliate links and verifies each
one returns a valid HTTP response.

Usage:
    python tools/check_affiliate_links.py

Requirements:
    pip install requests   (falls back to urllib if not available)
"""

import re
import sys
import os

# Affiliate domains to scan for
AFFILIATE_DOMAINS = [
    'go.nordvpn.net',
    'go.nordpass.io',
    'tryhackme.com',
    'hackthebox.com',
    'udemy.com',
    'amazon.com',
    'impact.com',
]

# Files to scan (relative to project root)
SCAN_FILES = [
    'index.html',
    'js/app.js',
]

# Resolve project root (one directory up from tools/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------

def find_affiliate_urls(files):
    """Extract all unique affiliate URLs from the given files."""
    url_pattern = re.compile(r'https?://[^\s\'"<>)]+')
    found = {}  # url -> list of (file, line_number)

    for rel_path in files:
        abs_path = os.path.join(PROJECT_ROOT, rel_path)
        if not os.path.exists(abs_path):
            print(f"  WARNING: File not found: {rel_path}")
            continue
        with open(abs_path, 'r', encoding='utf-8', errors='ignore') as f:
            for lineno, line in enumerate(f, 1):
                for url in url_pattern.findall(line):
                    # Strip trailing punctuation artifacts
                    url = url.rstrip('\'",;)>\\')
                    if any(domain in url for domain in AFFILIATE_DOMAINS):
                        if url not in found:
                            found[url] = []
                        found[url].append((rel_path, lineno))
    return found


def check_url(url):
    """Send a HEAD request and return (status_code, error_message)."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; InfoSecDeck-LinkChecker/1.0)',
    }
    try:
        import requests
        resp = requests.head(url, headers=headers, allow_redirects=True, timeout=10)
        return resp.status_code, None
    except ImportError:
        pass

    # Fallback: urllib
    import urllib.request
    import urllib.error
    req = urllib.request.Request(url, method='HEAD', headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return None, str(e)


def status_label(code):
    if code is None:
        return 'ERROR'
    if 200 <= code < 300:
        return 'PASS '
    if 300 <= code < 400:
        return 'WARN '
    # 403/405 often means the server blocked HEAD requests (bot protection),
    # not that the link is broken. Treat as warning, not failure.
    if code in (403, 405):
        return 'WARN '
    return 'FAIL '


def main():
    print()
    print('Affiliate Link Audit — InfoSecDeck')
    print('=' * 60)
    print(f'Scanning: {", ".join(SCAN_FILES)}')
    print()

    url_map = find_affiliate_urls(SCAN_FILES)

    if not url_map:
        print('No affiliate links found. Check AFFILIATE_DOMAINS list.')
        sys.exit(0)

    results = []
    for url, locations in sorted(url_map.items()):
        code, err = check_url(url)
        label = status_label(code)
        code_str = str(code) if code else 'N/A'
        results.append((label, code_str, url, locations, err))

    # Print results
    for label, code_str, url, locations, err in results:
        loc_str = ', '.join(f'{f}:{ln}' for f, ln in locations[:2])
        suffix = ''
        if label == 'WARN ':
            suffix = '  (redirect — verify destination)'
        if err:
            suffix = f'  ({err})'
        print(f'{label}  {code_str:<4}  {url}')
        if suffix:
            print(f'           {suffix}')
        print(f'           Found in: {loc_str}')
        print()

    # Summary
    print('=' * 60)
    passed = sum(1 for r in results if r[0] == 'PASS ')
    warned = sum(1 for r in results if r[0] == 'WARN ')
    failed = sum(1 for r in results if r[0] in ('FAIL ', 'ERROR'))
    total = len(results)
    print(f'{total} link(s) found | {passed} passed | {warned} warning(s) | {failed} failed')

    if failed > 0:
        print('\nAction required: fix failed links per workflows/affiliate_audit.md')
        sys.exit(1)
    elif warned > 0:
        print('\nWarnings: manually verify redirected links land on the correct page.')
        sys.exit(0)
    else:
        print('\nAll affiliate links are healthy.')


if __name__ == '__main__':
    main()
