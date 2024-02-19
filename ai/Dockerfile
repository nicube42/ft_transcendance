# Use an official Python runtime as a parent image
FROM python:3.8-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY ./ai/files /app

# Install any needed packages specified in requirements.txt
COPY ./ai/files/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5678 available to the world outside this container
# Adjust this if your AI application uses a different port
EXPOSE 5678

# Define environment variable
ENV NAME World

# Run ai.py when the container launches
CMD ["python", "./files/ai.py"]
