#!/bin/bash
# Script to update AI libraries on Timeweb production server
# Fixes: Client.__init__() got an unexpected keyword argument 'proxies'

set -e

echo "=========================================="
echo "  MultiChat - Production Library Update"
echo "=========================================="
echo ""

# Navigate to backend directory
cd /var/www/multichat/backend || { echo "Error: Backend directory not found"; exit 1; }

# Activate virtual environment
echo "1. Activating virtual environment..."
source venv/bin/activate || { echo "Error: Cannot activate venv"; exit 1; }
echo "✓ Virtual environment activated"
echo ""

# Show current versions
echo "2. Current library versions:"
pip show openai anthropic google-generativeai httpx pytesseract Pillow 2>/dev/null | grep -E "Name:|Version:" | head -12
echo ""

# Update libraries
echo "3. Updating AI libraries..."
pip install --upgrade \
    openai==1.54.0 \
    anthropic==0.39.0 \
    google-generativeai==0.8.3 \
    httpx==0.27.2 \
    Pillow==12.1.0 \
    pytesseract==0.3.13

echo ""
echo "✓ Libraries updated successfully"
echo ""

# Show new versions
echo "4. New library versions:"
pip show openai anthropic google-generativeai httpx pytesseract Pillow 2>/dev/null | grep -E "Name:|Version:" | head -12
echo ""

# Clear Python cache
echo "5. Clearing Python cache..."
find /var/www/multichat/backend/app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /var/www/multichat/backend/app -type f -name "*.pyc" -delete 2>/dev/null || true
echo "✓ Cache cleared"
echo ""

# Restart backend service
echo "6. Restarting MultiChat backend..."
sudo systemctl restart multichat
sleep 3

# Check service status
if systemctl is-active --quiet multichat; then
    echo "✓ Backend restarted successfully"
else
    echo "✗ Warning: Backend may not be running properly"
    sudo systemctl status multichat --no-pager
fi

echo ""
echo "=========================================="
echo "  Update completed!"
echo "=========================================="
echo ""
echo "Changes:"
echo "  • openai: 1.10.0 → 1.54.0 (fixes proxies error)"
echo "  • anthropic: 0.18.1 → 0.39.0"
echo "  • google-generativeai: 0.3.2 → 0.8.3"
echo "  • httpx: 0.26.0 → 0.27.2"
echo "  • Pillow: 10.2.0 → 12.1.0 (Python 3.14)"
echo "  • pytesseract: 0.3.10 → 0.3.13"
echo ""
echo "Test Arena at: https://wrongfully-suited-jaybird.cloudpub.ru/"
echo ""
