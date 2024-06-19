import joblib
import numpy as np
from tensorflow.keras.models import load_model as load_model_keras
from sklearn.preprocessing import StandardScaler

# Function to load the model and the label encoder
def load_model(model_path):
    model = load_model_keras(model_path)
    return model

# Function to load the scaler
def load_scaler(scaler_path):
    return joblib.load(scaler_path)

# Function to load the label encoder
def load_encoder(encoder_path):
	return joblib.load(encoder_path)

# Function to make predictions on new data
def predict_workout(model, label_encoder, scaler, new_data):
    # Normalize the new data using the same scaler
    new_data = scaler.transform(new_data.reshape(-1, new_data.shape[2])).reshape(new_data.shape)
    
    # Predict the class probabilities
    predictions = model.predict(new_data)
    
    # Decode the predicted labels
    predicted_labels = label_encoder.inverse_transform(np.argmax(predictions, axis=1))
    
    return predicted_labels

