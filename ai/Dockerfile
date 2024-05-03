# Use an official Python runtime as a parent image
FROM python:3.8-slim

# Set the working directory in the container to /app
WORKDIR /app

# Install any needed packages specified in requirements.txt
COPY ./ai/files/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY ./ai/files /app

# Copy SSL certificate and key from host machine to container
COPY ./ai/certs/t.crt /app/ssl/domain.crt
COPY ./ai/certs/t.key /app/ssl/domain.key

# Make port 5678 available to the world outside this container
EXPOSE 5678

# Run ai.py when the container launches
CMD ["python", "./ai.py"]
