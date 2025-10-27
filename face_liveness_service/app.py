from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import numpy as np

app = Flask(__name__)

@app.route("/check-liveness", methods=["POST"])
def check_liveness():
    if "file" not in request.files:
        return jsonify({"error": "no file uploaded"}), 400

    file = request.files["file"]
    img_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    try:
        # Dùng anti_spoofing=True để bật phát hiện giả mạo (spoof detection)
        result = DeepFace.extract_faces(
            img_path=frame,
            detector_backend="opencv",
            enforce_detection=False,
            anti_spoofing=True
        )

        if not result:
            return jsonify({"is_real": False, "score": 0.0}), 200

        # DeepFace đã tự trả về "is_real" và "confidence"
        face = result[0]
        is_real = bool(face.get("is_real", False))
        confidence = round(float(face.get("confidence", 0.0)), 2)

        return jsonify({
            "is_real": is_real,
            "score": confidence
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
