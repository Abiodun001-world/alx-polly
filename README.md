# Alx Polly - Polling App

A modern polling application built with Next.js 15, TypeScript, Tailwind CSS, and Supabase for authentication and data storage.

## Features

- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📊 **Poll Creation**: Create polls with multiple options
- 🗳️ **Voting**: Vote on polls with real-time updates
- 📈 **Results**: View poll results with visual progress bars
- 🎨 **Modern UI**: Beautiful interface built with shadcn/ui components
- 📱 **Responsive**: Mobile-friendly design
- 🔒 **Protected Routes**: Authentication guards for secure access
- ✅ **Form Validation**: Comprehensive form validation with Zod

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abiodun001-world/alx-polly.git
   cd alx-polly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Database Setup**
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create users table (extends Supabase auth.users)
   CREATE TABLE public.users (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create polls table
   CREATE TABLE public.polls (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
     is_active BOOLEAN DEFAULT true,
     expires_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create poll options table
   CREATE TABLE public.poll_options (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
     text TEXT NOT NULL,
     votes INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create votes table
   CREATE TABLE public.votes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
     option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
     user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(poll_id, user_id)
   );

   -- Enable Row Level Security
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view their own profile" ON public.users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update their own profile" ON public.users
     FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Anyone can view active polls" ON public.polls
     FOR SELECT USING (is_active = true);

   CREATE POLICY "Authenticated users can create polls" ON public.polls
     FOR INSERT WITH CHECK (auth.uid() = created_by);

   CREATE POLICY "Anyone can view poll options" ON public.poll_options
     FOR SELECT USING (true);

   CREATE POLICY "Authenticated users can vote" ON public.votes
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Create function to handle user creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.users (id, email, name)
     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Create trigger for new user creation
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/         # Login page
│   │   └── register/      # Register page
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── polls/         # Poll management
│   │   └── profile/       # User profile
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── polls/            # Poll-related components
│   ├── ui/               # shadcn/ui components
│   └── common/           # Common components
├── lib/                  # Utility functions
│   ├── auth-context.tsx  # Authentication context
│   ├── supabase.ts       # Supabase client
│   ├── validations.ts    # Form validation schemas
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Authentication Flow

1. **Registration**: Users can create accounts with email/password
2. **Email Verification**: Supabase sends verification emails
3. **Login**: Users sign in with their credentials
4. **Session Management**: Automatic session persistence
5. **Protected Routes**: Dashboard routes require authentication
6. **Sign Out**: Users can sign out and clear their session

## Key Components

### Authentication
- `AuthProvider`: Context provider for authentication state
- `AuthGuard`: Component to protect routes
- `LoginForm`: Sign-in form with validation
- `RegisterForm`: Registration form with validation

### Polls
- `PollCard`: Display poll information
- `PollForm`: Create new polls
- `PollVote`: Vote on polls
- `PollResults`: Show poll results

### Layout
- `Header`: Main navigation with auth state
- `Navigation`: Dashboard navigation
- `Footer`: Site footer

## API Routes

- `POST /api/auth/login`: Handle login requests
- `POST /api/auth/register`: Handle registration requests
- `GET /api/polls`: Fetch all polls
- `POST /api/polls`: Create new poll
- `GET /api/polls/[id]`: Get specific poll
- `POST /api/polls/[id]/vote`: Vote on a poll

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | No |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

1. Use shadcn/ui for new UI components:
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. Create custom components in the appropriate directory under `components/`

### Database Changes

1. Make changes in Supabase dashboard
2. Update types in `lib/supabase.ts`
3. Update API routes if needed

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
