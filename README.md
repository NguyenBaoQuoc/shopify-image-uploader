# Shopify Image Uploader

A Node.js tool to upload images into Shopify product metafields using the Shopify Admin API.  
Supports both single and multiple images per metafield (`file_reference` and `list.file_reference`).  
Image sources URLs, mapped to products and metafields via Google Sheets.

---

## Features

- Upload images to Shopify Files from URLs or local files.
- Create metafield definitions (including `list.file_reference` for multiple images).
- Associate images with products and metafields based on Google Sheet mapping.
- Logs all upload and association results (success and failure).
- Designed for easy extension and automation.

---

## Installation

1. **Unzip the project folder** you received.

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Configure environment variables:**

    Create a `.env` file in the root directory with your Shopify store and API credentials:
    ```
    SHOPIFY_API_TOKEN=your-shopify-access-token
    SHOPIFY_STORE_URL=https://your-store.myshopify.com
    SHOPIFY_API_VERSION=2023-10
    ```

4. **Google Sheet:**
    - Data and structure logic on file https://docs.google.com/spreadsheets/d/1zautDsT1Wx4Y6-kpQRxXoJlCKJzqC2J6O560W6yYv58/edit?gid=0#gid=0

---

## Logic & Data Flow

1. **Associate Images with Products:**
    - View in https://docs.google.com/spreadsheets/d/1zautDsT1Wx4Y6-kpQRxXoJlCKJzqC2J6O560W6yYv58/edit?gid=0#gid=0
    - Data in products, metafields, images.
    - Structure in product-meta-images

5. **Logging:**
    - All actions and errors are logged to `log.txt` for auditing.

---

## Usage

1. **Prepare your Google Sheet** with columns for products, metafields, images, and mapping (product-meta-images).
2. **Run the script:**
    To clean all data: metadata, files and products
    ```sh
    npm run clean
    ```
    To run:
    ```sh
    npm run start
    ```
3. **Check `log.txt`** for a summary of all actions and any errors.
4. **Check my Shopify store:**  
   - Website: [https://pyhyup-bz.myshopify.com/](https://pyhyup-bz.myshopify.com/)  
   - :Password `admin@12#`
---

## Author

NGUYEN BAO QUOC - FULLSTACK DEV

---