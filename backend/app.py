from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from PIL import Image
import tensorflow as tf
import numpy as np

app = Flask(__name__)
CORS(app)

# Load trained model
model = tf.keras.models.load_model("pet_breed_classifier.keras")

# Exact class order used during training
class_names = [
    "Abyssinian",
    "Bengal",
    "Birman",
    "Bombay",
    "British_Shorthair",
    "Egyptian_Mau",
    "Maine_Coon",
    "Persian",
    "Ragdoll",
    "Russian_Blue",
    "Siamese",
    "Sphynx",
    "american_bulldog",
    "american_pit_bull_terrier",
    "basset_hound",
    "beagle",
    "boxer",
    "chihuahua",
    "english_cocker_spaniel",
    "english_setter",
    "german_shorthaired",
    "great_pyrenees",
    "havanese",
    "japanese_chin",
    "keeshond",
    "leonberger",
    "miniature_pinscher",
    "newfoundland",
    "pomeranian",
    "pug",
    "saint_bernard",
    "samoyed",
    "scottish_terrier",
    "shiba_inu",
    "staffordshire_bull_terrier",
    "wheaten_terrier",
    "yorkshire_terrier"
]


# =========================
# FRONTEND
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# =========================
# PREDICTION API
# =========================

@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    file = request.files["image"]

    try:
        image = Image.open(file).convert("RGB")
        image = image.resize((224, 224))

        image_array = np.array(image)
        image_array = np.expand_dims(image_array, axis=0)

        predictions = model.predict(
            image_array,
            verbose=0
        )

        predicted_index = np.argmax(predictions[0])

        confidence = float(
            predictions[0][predicted_index]
        )

        prediction = class_names[predicted_index]

        return jsonify({
            "prediction": prediction,
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":

    app.run(host="127.0.0.1", port=5001, debug=True)
