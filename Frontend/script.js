// Elements
const fileInput = document.getElementById('file-input');
const uploadLabel = document.getElementById('upload-label');
const uploadForm = document.getElementById('upload-form');
const outputText = document.getElementById('output-text');
const resultImage = document.getElementById('result-image');
const themeToggleBtn = document.getElementById('theme-toggle');

const startCameraBtn = document.getElementById('start-camera-btn');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
const reuploadBtn = document.getElementById('reupload-btn');
const submitBtn = document.getElementById('submit-btn');

const previewImage = document.getElementById('preview-image');
const cameraPreview = document.getElementById('camera-preview');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const errorMsg = document.getElementById('error-msg');

let currentStream = null;
let selectedImageBlob = null;

// Handle file upload change
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  selectedImageBlob = file;

  previewImage.src = URL.createObjectURL(file);
  previewImage.style.display = "block";

  // Show reupload and submit side by side
  reuploadBtn.style.display = "inline-block";
  submitBtn.style.display = "inline-block";

  // Hide camera related buttons
  retakeBtn.style.display = "none";
  captureBtn.style.display = "none";
  cameraPreview.classList.remove("show");

  // Hide start camera and upload label for cleaner UI
  startCameraBtn.style.display = "none";
  uploadLabel.style.display = "none";

  errorMsg.textContent = "";
  outputText.textContent = "Waiting for result...";
  resultImage.style.display = "none";
});

// Start camera button
startCameraBtn.addEventListener("click", async () => {
  errorMsg.textContent = "";
  outputText.textContent = "Waiting for result...";
  resultImage.style.display = "none";
  previewImage.style.display = "none";
  submitBtn.style.display = "none";
  reuploadBtn.style.display = "none";

  // Hide upload label and start camera button
  uploadLabel.style.display = "none";
  startCameraBtn.style.display = "none";

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = currentStream;
    cameraPreview.classList.add("show");

    captureBtn.style.display = "inline-block";
  } catch (error) {
    errorMsg.textContent = "Unable to access camera.";
  }
});

// Capture button
captureBtn.addEventListener("click", () => {
  console.log("Capture button clicked");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  // Stop camera stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  canvas.toBlob((blob) => {
    selectedImageBlob = blob;

    previewImage.src = URL.createObjectURL(blob);
    previewImage.style.display = "block";

    // Show retake and submit side by side
    retakeBtn.style.display = "inline-block";
    submitBtn.style.display = "inline-block";
    console.log("Showing Retake and Submit buttons");

    // Hide capture button and camera preview
    captureBtn.style.display = "none";
    cameraPreview.classList.remove("show");

    // Hide upload label and start camera button
    uploadLabel.style.display = "none";
    startCameraBtn.style.display = "none";

    reuploadBtn.style.display = "none";

    errorMsg.textContent = "";
    outputText.textContent = "Waiting for result...";
    resultImage.style.display = "none";
  }, "image/jpeg");
});

// Retake button (after capture)
// retakeBtn.addEventListener("click", async () => {
//   console.log("Retake button clicked");

//   // Reset UI - hide unnecessary buttons
//   previewImage.style.display = "none";  // Hide preview image
//   submitBtn.style.display = "none";  // Hide Submit button
//   retakeBtn.style.display = "none";  // Hide Retake button
//   outputText.textContent = "Waiting for result...";  // Reset output text
//   resultImage.style.display = "none";  // Hide result image
//   errorMsg.textContent = "";  // Clear any error messages

//   // Show only Upload Photo and Start Camera buttons
//   uploadLabel.style.display = "inline-block";  // Show Upload button
//   startCameraBtn.style.display = "inline-block";  // Show Start Camera button

//   // Hide other buttons
//   captureBtn.style.display = "none";  // Hide Capture button
//   reuploadBtn.style.display = "none";  // Hide Reupload button

//   // Stop any active camera streams
//   if (currentStream) {
//     currentStream.getTracks().forEach(track => track.stop());
//     currentStream = null;
//   }

//   try {
//     currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
//     video.srcObject = currentStream;
//     cameraPreview.classList.add("show");

//     // Show Capture button
//     captureBtn.style.display = "inline-block";  // Show Capture button after retake
//     console.log("Showing Capture button after retake");
//   } catch (error) {
//     errorMsg.textContent = "Unable to access camera.";
//   }
// });
// Retake button (after capture)
retakeBtn.addEventListener("click", () => {
  console.log("Retake button clicked");

  // Hide all buttons
  captureBtn.style.display = "none";  // Hide Capture button
  submitBtn.style.display = "none";  // Hide Submit button
  reuploadBtn.style.display = "none";  // Hide Reupload button
  retakeBtn.style.display = "none";  // Hide Retake button
  
  // Show only Upload Photo and Start Camera buttons
  uploadLabel.style.display = "inline-block";  // Show Upload button
  startCameraBtn.style.display = "inline-block";  // Show Start Camera button

  console.log("Showing Upload Photo and Start Camera buttons");
});


// Reupload button (after upload)
reuploadBtn.addEventListener("click", () => {
  fileInput.value = null;  // Clear previous selection
  fileInput.click();
});

// Handle form submission
submitBtn.addEventListener('click', async () => {
  console.log("Submit button clicked");

  if (!selectedImageBlob) {
    alert("Please upload or capture a photo first!");
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedImageBlob, "image.jpg");

  outputText.textContent = "Processing image... ⏳";
  resultImage.style.display = "none";

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed!");

    const data = await response.json();
    outputText.textContent = data.text;
    resultImage.src = data.image_url;
    resultImage.style.display = "block";

    console.log("Submit successful");
  } catch (error) {
    outputText.textContent = `❌ Error: ${error.message}`;
    console.log("Error during submit", error);
  }
});


// Theme toggle
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeToggleBtn.textContent = "☀️ Light Theme";
  } else {
    themeToggleBtn.textContent = "🌙 Dark Theme";
  }
});

// Set initial theme button state
window.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("dark")) {
    themeToggleBtn.textContent = "☀️ Light Theme";
  } else {
    themeToggleBtn.textContent = "🌙 Dark Theme";
  }
});
