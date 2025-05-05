# Idea Miner

A Next.js application that helps you discover trending phrases and ideas using Google's Programmable Search Engine.

## Features

- Search for trending phrases with customizable time ranges
- Clean and modern UI built with Tailwind CSS
- Real-time search results from Google's Programmable Search Engine
- Responsive design for all devices

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```
   GOOGLE_API_KEY=your-google-api-key
   SEARCH_ENGINE_ID=your-search-engine-id
   ```

   To get these credentials:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Custom Search API
   - Create credentials (API key)
   - Go to the [Programmable Search Engine](https://programmablesearchengine.google.com/) to create a search engine and get your Search Engine ID

   ```bash
   npm run dev
   ```

## Project Structure

```
/my-idea-miner-app
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/         # API routes
│   │   └── page.tsx     # Main page
├── public/              # Static files
├── tailwind.config.js   # Tailwind configuration
└── .env.local          # Environment variables
```

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Google Programmable Search Engine API
- Axios

## License

MIT
