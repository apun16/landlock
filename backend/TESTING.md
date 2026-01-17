# Testing the Landlock Backend

## Quick Start

### Option 1: Automated Setup & Test

Run the setup script that installs dependencies and runs tests:

```bash
cd backend
./setup_and_test.sh
```

This will:
1. Create a virtual environment (if needed)
2. Install all dependencies
3. Run basic import tests
4. Run the full pytest test suite

### Option 2: Manual Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run basic test (no network required)
python3 test_basic.py

# Run full test suite
pytest tests/ -v
```

## What Gets Tested

### 1. Basic Import Test (`test_basic.py`)
- Verifies all modules can be imported
- Tests model validation (citation enforcement)
- Tests agent initialization and basic logic
- **No dependencies needed** (but will fail if pydantic isn't installed)

### 2. Unit Tests (`tests/`)

- **test_models.py**: Data model validation
  - Citation model
  - ExtractedFact requires citations
  - Agent output models

- **test_scraper.py**: Web scraper functionality
  - Source discovery
  - Document storage
  - Uses `responses` library to mock HTTP calls (no live network)

- **test_source_registry.py**: Source registry
  - Adding/retrieving sources
  - Querying by region/category

- **test_extractors.py**: Fact extraction
  - Extracting from HTML
  - Extracting from PDF
  - Citation assignment

- **test_agents.py**: Agent logic
  - Budget Analyst
  - Policy Analyst
  - Underwriter
  - Evidence enforcement

## Running Specific Tests

```bash
# Run only model tests
pytest tests/test_models.py -v

# Run only scraper tests
pytest tests/test_scraper.py -v

# Run with coverage
pytest --cov=backend --cov-report=term-missing

# Run a specific test function
pytest tests/test_models.py::test_extracted_fact_requires_citations -v
```

## Expected Test Results

All tests should pass. Here's what to expect:

```
✓ Basic import test: All modules import correctly
✓ Model validation: Facts require citations (enforced)
✓ Scraper: Discovers and stores documents (mocked)
✓ Registry: Stores and retrieves sources
✓ Extractors: Extracts facts from HTML/PDF
✓ Agents: Produces valid outputs with citations
```

## Testing Without Network Access

All tests use **fixtures and mocks** - no live network calls are made:
- HTTP requests are mocked with `responses` library
- HTML/PDF content is provided via fixtures
- No actual web scraping happens during tests

## Troubleshooting

### "ModuleNotFoundError: No module named 'pydantic'"
- Run: `pip install -r requirements.txt`
- Make sure virtual environment is activated: `source venv/bin/activate`

### "pytest: command not found"
- Install pytest: `pip install pytest`
- Or install all deps: `pip install -r requirements.txt`

### Tests fail with import errors
- Check you're in the `backend/` directory
- Verify virtual environment is activated
- Run: `pip install -r requirements.txt`

### Want to test with live data?
- Use the CLI: `python3 cli.py --region vancouver --base-url https://vancouver.ca ...`
- Or use the API endpoints (requires running the server)
