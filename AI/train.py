import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
import joblib

from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Define the window size
window_size = 30

# Define the path to the CSV files
data_dir = "./DATA"
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
model.fit(train_data, train_labels, epochs=50, batch_size=32)

# Save the model
model.save(os.path.join(model_dir, 'workout_prediction_model.h5'))

loss, accuracy = model.evaluate(test_data, test_labels)
print("Test Loss:", loss)
print("Test Accuracy:", accuracy)

# Make predictions on the test data
predictions = model.predict(test_data)
predicted_labels = np.argmax(predictions, axis=1)
true_labels = np.argmax(test_labels, axis=1)

# Calculate the confusion matrix
cm = confusion_matrix(true_labels, predicted_labels)

# Plot the confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=label_encoder.classes_, 
            yticklabels=label_encoder.classes_)
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.title('Confusion Matrix')
plt.show()