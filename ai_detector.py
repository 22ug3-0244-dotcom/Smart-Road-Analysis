import os
import requests
import time

# This simulates the CNN 'scanning' a real folder of images
IMAGE_FOLDER = "test_images"

def scan_for_cracks():
    print(f"--- AI System Scanning Folder: {IMAGE_FOLDER} ---")
    
    files = os.listdir(IMAGE_FOLDER)
    if not files:
        print("No images found in folder! Please add some road photos.")
        return

    for file_name in files:
        print(f"Processing {file_name} through CNN Layers...")
        time.sleep(2) # Simulating AI processing time
        
        # This is the 'Detection' result
        data = {
            "id": int(time.time()),
            "type": "Crack Detected (CNN)",
            "severity": "High",
            "location": "Latitude: 6.9, Longitude: 79.8",
            "lat": 6.9271, 
            "lng": 79.8612
        }
        
        # Send to Dashboard
        requests.post("http://localhost:5000/api/add-crack", json=data)
        print(f"Found damage in {file_name}! Updated Dashboard Map.")

scan_for_cracks()