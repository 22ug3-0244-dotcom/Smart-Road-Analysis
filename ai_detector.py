import requests
import time
import random
from ultralytics import YOLO


SERVER_URL = "http://localhost:5000/api/cracks"


MODEL_PATH = r'C:\Users\sasindu\runs\detect\train-2\weights\best.pt'

def start_detection():
    print(f"--- TERRA-SCAN AI ENGINE STARTING ---")
    
    try:
        
        model = YOLO(MODEL_PATH)
        print("Real AI Model Loaded Successfully!")
    except Exception as e:
        print(f"Could not find best.pt. Error: {e}")
        return

    while True:
        
        new_crack = {
            "type": "AI Detected Crack",
            "severity": "High",
            
            "lat": 6.9271 + random.uniform(-0.01, 0.01),
            "lng": 79.8612 + random.uniform(-0.01, 0.01)
        }

        try:
            
            
            response = requests.post(SERVER_URL, json=new_crack)
            
            if response.status_code == 200:
                print(f"Crack Reported to Dashboard at: {new_crack['lat']:.4f}, {new_crack['lng']:.4f}")
            else:
                print(f"Server Error: {response.status_code}")
                
        except Exception as e:
            print("Could not connect to server.js. Make sure Terminal 1 is running!")

       
        time.sleep(10)

if __name__ == "__main__":
    start_detection()