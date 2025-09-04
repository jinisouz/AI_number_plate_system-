from flask import Flask, request, jsonify, send_from_directory
import os
import torch
import cv2
import easyocr
import numpy as np

# Add YOLOv5 repo to Python path
import sys
sys.path.insert(0, "yolov5")

from models.common import DetectMultiBackend
from utils.general import non_max_suppression, scale_boxes
from utils.torch_utils import select_device

# Initialize Flask app
app = Flask(__name__)

# Ensure folders exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
os.makedirs("models", exist_ok=True)  # place best.pt here

# Load YOLOv5 model
device = select_device('cpu')  # force CPU for deployment
MODEL_PATH = os.path.join("models", "best.pt")
model = DetectMultiBackend(MODEL_PATH, device=device)
stride, names, pt = model.stride, model.names, model.pt

# Initialize EasyOCR
reader = easyocr.Reader(['en'], gpu=False)

@app.route("/")
def home():
    return "Number Plate Detection Backend Running!"

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Save uploaded file
    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)

    # Load image
    img = cv2.imread(filepath)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).float() / 255.0
    if img_tensor.ndim == 3:
        img_tensor = img_tensor.unsqueeze(0).to(device)

    # Run inference
    pred = model(img_tensor)
    pred = non_max_suppression(pred, 0.25, 0.45, None, False, max_det=5)

    # Process results
    detected_text = "Plate not detected"
    for det in pred:
        if len(det):
            det[:, :4] = scale_boxes(img_tensor.shape[2:], det[:, :4], img.shape).round()
            for *xyxy, conf, cls in det:
                x1, y1, x2, y2 = map(int, xyxy)
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cropped_plate = img[y1:y2, x1:x2]
                ocr_results = reader.readtext(cropped_plate)
                if ocr_results:
                    detected_text = ocr_results[0][1]
                break
        break

    # Save result image
    output_path = os.path.join("static", "result.jpg")
    cv2.imwrite(output_path, img)

    return jsonify({
        "text": detected_text,
        "image_url": "/static/result.jpg"
    })

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
