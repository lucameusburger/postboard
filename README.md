# Postboard

A real-time text display application designed for exhibitions and presentations. Postboard allows visitors to submit texts that are instantly displayed on a presentation screen with beautiful animations.

## Features

- 🎨 **Presentation Mode**: Full-screen display mode optimized for exhibitions and presentations
- ✍️ **Public Text Submission**: Visitors can submit texts through a simple form
- ⚡ **Real-time Updates**: New texts appear instantly on the presentation screen using WebSocket connections
- 🎭 **Animated Display**: Smooth typewriter animations for newly submitted texts
- 🛡️ **Content Filtering**: Built-in profanity filtering (English and German)
- 📱 **Responsive Design**: Works on various screen sizes

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Directus** - Headless CMS for data management
- **Framer Motion** - Animation library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Swearify** - Content filtering

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- A Directus instance (self-hosted or cloud)
- A Directus collection for storing texts

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd postboard
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Copy the `env.example` file to `.env.local`:

```bash
cp env.example .env.local
```

**Note:** If you prefer, you can rename `env.example` to `.env.example` - both work the same way.

Fill in your Directus configuration:

```env
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-static-token
DIRECTUS_TEXTS_COLLECTION=texts

NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com
NEXT_PUBLIC_DIRECTUS_TOKEN=your-static-token
```

**Important Notes:**
- `DIRECTUS_URL` and `DIRECTUS_TOKEN` are used for server-side operations
- `NEXT_PUBLIC_DIRECTUS_URL` and `NEXT_PUBLIC_DIRECTUS_TOKEN` are exposed to the client for realtime subscriptions
- Make sure your Directus instance allows WebSocket connections for realtime features
- The static token should have read and create permissions for your texts collection

### 4. Set Up Directus Collection

Create a collection in Directus with the following structure:

- **Collection Name**: `texts` (or match your `DIRECTUS_TEXTS_COLLECTION` value)
- **Fields**:
  - `id` (integer, auto-increment, primary key)
  - `content` (string/text, required)

Enable realtime subscriptions for this collection in Directus settings.

### 5. Run the Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Standard View

Visit the root URL (`/`) to see all submitted texts in a list view. Click the "Text hinzufügen" button to add a new text.

### Presentation Mode

Add `?presentation=true` to the URL to enable presentation mode:

```
http://localhost:3000/?presentation=true
```

In presentation mode:
- Texts are displayed full-screen
- New texts appear with a typewriter animation
- The submission button is hidden
- Perfect for displaying on a wall or large screen during exhibitions

### Adding Texts

1. Navigate to `/add` or click the "Text hinzufügen" button
2. Enter your text in the textarea
3. Submit the form
4. The text will appear instantly in presentation mode (if active)

## Project Structure

```
postboard/
├── app/
│   ├── add/              # Text submission page
│   ├── api/
│   │   └── texts/        # API route for creating texts
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page (list view + presentation mode)
├── components/
│   ├── RealtimeTexts.tsx # Real-time text display component
│   └── TextItem.tsx      # Individual text item with animations
├── lib/
│   └── directus.ts       # Directus client configuration
└── types/
    └── swearify.d.ts     # Type definitions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DIRECTUS_URL` | Your Directus instance URL | Yes |
| `DIRECTUS_TOKEN` | Static token for server-side operations | Yes |
| `DIRECTUS_TEXTS_COLLECTION` | Name of the collection storing texts | Yes |
| `NEXT_PUBLIC_DIRECTUS_URL` | Directus URL for client-side (realtime) | Yes |
| `NEXT_PUBLIC_DIRECTUS_TOKEN` | Static token for client-side (realtime) | Yes |

## Building for Production

```bash
pnpm build
pnpm start
```

## Deployment

### Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy!

### Other Platforms

Postboard can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Self-hosted with Node.js

Make sure to set all required environment variables in your deployment platform.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Directus](https://directus.io)
- Content filtering by [swearify](https://www.npmjs.com/package/swearify)
