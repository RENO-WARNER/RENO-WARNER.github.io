import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
import joblib

# Define the window size
window_size = 30

# Define the path to the CSV files
data_dir = "./DATA/RAW/CSV"
model_dir = "./MODEL"

# Function to create sequences from the data
def create_sequences(df, window_size):
    sequences = []
    for i in range(len(df) - window_size + 1):
        window = df.iloc[i:i + window_size]
        sequences.append(window.values)
    return sequences

# Load and process the data
data = []
labels = []
for filename in os.listdir(data_dir):
    if filename.endswith(".csv"):
        filepath = os.path.join(data_dir, filename)
        df = pd.read_csv(filepath)

        # Extract relevant features (accelerometer and gyroscope)
        features = df[["accelerometer/x", "accelerometer/y", "accelerometer/z",
                       "gyroscope/x", "gyroscope/y", "gyroscope/z"]]

        # Extract the workout label from the filename
        label = filename.split(".")[0]

        # Create sequences and labels
        sequences = create_sequences(features, window_size)
        
        data.extend(sequences)
        labels.extend([label] * len(sequences))  # Repeat label for each sequence

# Convert data and labels to numpy arrays
data = np.array(data)
labels = np.array(labels)

# Normalize the data
scaler = StandardScaler()
data = scaler.fit_transform(data.reshape(-1, data.shape[2])).reshape(data.shape)

# Encode the labels
label_encoder = LabelEncoder()
labels = label_encoder.fit_transform(labels)
labels = to_categorical(labels)  # Convert labels to one-hot encoding

# Save the label encoder for future use

joblib.dump(label_encoder, os.path.join(model_dir, "label_encoder.pkl"))
joblib.dump(scaler, os.path.join(model_dir, "scaler.pkl"))


# Split the data into training and testing sets
train_data, test_data, train_labels, test_labels = train_test_split(data, labels, test_size=0.2, random_state=42)

# Define the LSTM model
model = Sequential()
model.add(LSTM(units=50, input_shape=(window_size, data.shape[2])))
model.add(Dense(labels.shape[1], activation='softmax'))

# Compile the model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train the model
model.fit(train_data, train_labels, epochs=10, batch_size=32)

# Evaluate the model
loss, accuracy = model.evaluate(test_data, test_labels)
print("Test Loss:", loss)
print("Test Accuracy:", accuracy)

# Save the model
model.save(os.path.join(model_dir, 'workout_prediction_model.h5'))