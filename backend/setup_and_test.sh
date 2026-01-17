# Setup and test script for Landlock Backend

set -e

echo "========================================="
echo "Landlock Backend - Setup & Test"
echo "========================================="
echo ""

echo "1. Checking Python version..."
python3 --version
echo ""

if [ ! -d "venv" ]; then
    echo "2. Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "2. Virtual environment already exists"
fi
echo ""

echo "3. Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

echo "4. Upgrading pip..."
pip install --upgrade pip -q
echo "✓ pip upgraded"
echo ""

echo "5. Installing dependencies..."
echo "   (This may take a few minutes)"
pip install -r requirements.txt -q
echo "✓ Dependencies installed"
echo ""

echo "6. Running basic import test..."
python3 test_basic.py
echo ""

echo "7. Running pytest test suite..."
pytest tests/ -v --tb=short
echo ""

echo "========================================="
echo "✓ Setup and tests complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  - Run API server: python3 -m backend.api.main"
echo "  - Run CLI: python3 cli.py --help"
echo ""
