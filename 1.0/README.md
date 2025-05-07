# vhp-endpoint-demo

A simple demonstration project for testing XML body requests received by an endpoint. This application listens for incoming XML requests, saves the request body to a specific file in a designated folder, and then sends a custom response back to the sender. It's designed for testing purposes and exploring XML parsing, file saving, and handling custom responses.

## Features

- Receives XML body requests.
- Saves the received XML body in a folder with a timestamped filename.
- Provides a custom response based on the request.

## How It Works

1. The server listens for POST requests containing XML data.
2. The XML body is saved into a file in a specific folder (`XML`).
3. The filename includes the origin of the request, the date, and a Unix timestamp (seconds since midnight).
4. The server responds with a custom response.

## Usage

To run this project locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/alderrr/vhp-endpoint-demo.git
   ```

2. Navigate to the project directory:

   ```bash
   cd vhp-endpoint-demo
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Send a POST request with XML data to `http://localhost:<port>`.

## Example Request

```bash
curl -X POST http://localhost:<port> -d @yourfile.xml -H "Content-Type: application/xml" -H "Requestor_ID: YourName" -H "Client_ID: ID" -H "Client_Secret: Secret"
```

## Response

The server will save the XML file in the `XML` folder and respond with the original XML body.

## Why Use This?

This project is perfect for developers working with XML-based APIs or those who need to test endpoints that involve logging and handling XML requests.
