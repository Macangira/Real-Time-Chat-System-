import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Create logs directory
try:
    LOG_DIR = Path("logs")
    LOG_DIR.mkdir(exist_ok=True)
except OSError:
    LOG_DIR = Path("/tmp/logs")
    LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "app.log"

# Log format
LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | "
    "%(name)s | %(filename)s:%(lineno)d | %(message)s"
)

# Create logger
logger = logging.getLogger("crm")

logger.setLevel(logging.INFO)

# Prevent duplicate logs
logger.propagate = False

# Formatter
formatter = logging.Formatter(LOG_FORMAT)

# Console Handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

# File Handler (5 MB × 5 backups)
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=5 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
file_handler.setFormatter(formatter)

# Avoid duplicate handlers on reload
if not logger.handlers:
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)