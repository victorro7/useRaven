# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY ./backend/requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container at /app
COPY ./backend /app/backend

# Make port 8000 available to the world outside this container
# EXPOSE is documentation, and not strictly necessary with Cloud Run
# EXPOSE 8000 # Removed EXPOSE

# Define environment variable (you can override these at runtime)
# No longer needed: ENV PORT=8000

# Run the application using Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080}"]