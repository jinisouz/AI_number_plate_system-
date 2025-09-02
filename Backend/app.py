from flask import Flask, request, jsonify, send_from_directory
import os
from ultralytics import YOLO
import cv2
import easyocr

# Initialize Flask app
app = Flask(__name__)

# Ensure folders exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
os.makedirs("models", exist_ok=True)  # place best.pt here

# Load your custom YOLO model
MODEL_PATH = os.path.join("models", "best.pt")
model = YOLO(MODEL_PATH)

# Initialize EasyOCR
reader = easyocr.Reader(['en'])

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

    # Run YOLO detection
    results = model(filepath)

    # Save image with boxes
    output_path = os.path.join("static", "result.jpg")
    results[0].plot()             # draw bounding boxes
    results[0].img.save(output_path)

    # Crop first detected plate for OCR
    detected_text = "Plate not detected"
    if len(results[0].boxes) > 0:
        box = results[0].boxes.xyxy[0]  # x1, y1, x2, y2
        img_array = results[0].orig_img
        x1, y1, x2, y2 = map(int, box)
        cropped_plate = img_array[y1:y2, x1:x2]
        ocr_results = reader.readtext(cropped_plate)
        if ocr_results:
            detected_text = ocr_results[0][1]

    return jsonify({
        "text": detected_text,
        "image_url": "/static/result.jpg"
    })

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
