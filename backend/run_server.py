import sys, os, logging
sys.path.insert(0, r"E:\AI\data-agent")
logging.basicConfig(level=logging.DEBUG)
import uvicorn
uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, log_level="debug")
