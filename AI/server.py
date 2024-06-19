import os
from flask import Flask, request, jsonify
import numpy as np
import joblib
from model import load_model, load_encoder, predict_workout, load_scaler
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

model_dir = "./MODEL"

# Load the model, label encoder, and scaler
model = load_model(os.path.join(model_dir, 'workout_prediction_model.h5'))
label_encoder = load_encoder(os.path.join(model_dir, "label_encoder.pkl"))
scaler = load_scaler(os.path.join(model_dir, "scaler.pkl"))

# Define the window size
WINDOW_SIZE = 30

@app.route('/predict', methods=['POST'])
def predict():
    # Get the JSON data from the request
    data = request.json
    
    # Convert the data into a numpy array
    # Assume the input data is a list of lists, where each inner list represents sensor data for one time step
    new_data = np.array(data)
    
    # Ensure the data has the correct shape (1, window_size, num_features)
    if new_data.shape != (WINDOW_SIZE, 6):
        return jsonify({'error': 'Invalid input shape, expected (30, 6)'}), 400
    
    new_data = new_data.reshape(1, WINDOW_SIZE, 6)
    
    # Make predictions
    predicted_labels = predict_workout(model, label_encoder, scaler, new_data)
    
    # Return the predicted label as a JSON response
    return jsonify({'predicted_label': predicted_labels[0]})

if __name__ == '__main__':
    app.run(debug=True, port= 5000, host="192.168.1.73")
    
