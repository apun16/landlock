# Quick Test Instructions

## Fastest Way to Verify Everything Works

```bash
cd backend

# 1. Install dependencies (one-time setup)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Run basic test (verifies structure)
python3 test_basic.py

# 3. Run full test suite
pytest tests/ -v
```

## Or Use Automated Script

```bash
cd backend
./setup_and_test.sh
```

## Expected Output

You should see:
- ✓ All imports work
- ✓ Models validate correctly
- ✓ Agents run without errors
- ✓ All pytest tests pass

If all tests pass, the backend is working correctly!
