# SkillSwap Supabase + Docker Messaging System

This document explains how to set up and use the hybrid architecture where Firebase handles authentication and other features, while Supabase handles the messaging system with Docker for local development.

## 🏗️ Architecture Overview

### Hybrid Setup
- **Firebase**: Authentication, user profiles, skill posts, connections
- **Supabase**: Real-time messaging system with PostgreSQL
- **Docker**: Local Supabase development environment

### Benefits
- **Best of both worlds**: Firebase's excellent auth + Supabase's superior real-time messaging
- **Local development**: Full control over messaging database with Docker
- **Scalable**: Easy to migrate to production Supabase when ready
- **Cost effective**: Local development is free, pay only for production usage

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js and npm/yarn
- Existing Firebase project (for auth and other features)

### Setup Steps

1. **Run the setup script**:
   ```powershell
   .\setup-supabase.ps1
   ```

2. **Update your `.env` file** with Firebase credentials:
   ```env
   # Firebase Configuration (for existing features)
   VITE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_PROJECT_ID=your_firebase_project_id
   # ... other Firebase config

   # Supabase Configuration (for messaging)
   VITE_SUPABASE_URL=http://localhost:8000
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```

3. **Start your React app**:
   ```bash
   npm run dev
   ```

4. **Access Supabase Studio**:
   - Open http://localhost:3001
   - Explore the messaging database schema

## 📊 Database Schema

### Messages Table
```sql
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    content text NOT NULL,
    conversation_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    is_read boolean DEFAULT false,
    updated_at timestamptz DEFAULT now()
);
```

### Conversations Table
```sql
CREATE TABLE public.conversations (
    id text PRIMARY KEY,
    user1_id text NOT NULL,
    user2_id text NOT NULL,
    last_message_id uuid,
    last_message_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Security (Row Level Security)
- Users can only see their own messages
- Users can only send messages as themselves
- Real-time subscriptions respect security policies

## 🔧 Services

### Docker Services
- **PostgreSQL**: Main database (port 5432)
- **Kong**: API Gateway (port 8000)
- **GoTrue**: Auth service (integrated)
- **PostgREST**: Auto-generated API (via Kong)
- **Realtime**: WebSocket subscriptions (via Kong)
- **Studio**: Web dashboard (port 3001)

### Key URLs
- **Supabase API**: http://localhost:8000
- **Supabase Studio**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 💾 Data Flow

### Sending a Message
1. User types message in React app
2. `useMessages` hook calls `SupabaseMessageService.sendMessage()`
3. Firebase auth token is included for verification
4. Message is inserted into Supabase PostgreSQL
5. Trigger creates/updates conversation record
6. Real-time subscription notifies all connected clients

### Real-time Updates
1. Supabase Realtime monitors database changes
2. WebSocket connection sends updates to subscribed clients
3. React app receives update via `subscribeToConversation()`
4. UI automatically updates with new messages

## 🛠️ Development Commands

### Docker Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart realtime

# Check service status
docker-compose ps
```

### Database Management
```bash
# Connect to PostgreSQL
docker exec -it skillswap-blue-welcome-02-db-1 psql -U postgres -d postgres

# View tables
\dt

# Check messages
SELECT * FROM public.messages ORDER BY created_at DESC LIMIT 10;
```

## 🔍 Debugging

### Check Real-time Connections
1. Open browser Developer Tools
2. Go to Console tab
3. Look for Supabase subscription messages:
   ```
   Setting up Supabase subscription for conversation: user1_user2
   Received Supabase messages update: [...]
   ```

### Common Issues

#### Messages not appearing
- Check if Docker services are running: `docker-compose ps`
- Verify WebSocket connection in Network tab
- Check console for subscription errors

#### Authentication errors
- Ensure Firebase token is being passed correctly
- Check if user is properly authenticated with Firebase

#### Database connection issues
- Restart Docker services: `docker-compose restart`
- Check PostgreSQL logs: `docker-compose logs db`

### Debug Tools

In development mode, you can use browser console:
```javascript
// Send a test message
await SupabaseMessageService.sendMessage({
  senderId: 'user1',
  receiverId: 'user2', 
  content: 'Test message',
  firebaseToken: 'your-token'
});

// Get conversation messages
await SupabaseMessageService.getConversationMessages('user1', 'user2');
```

## 📈 Performance Optimization

### Indexing
The database includes optimized indexes:
- `conversation_id` for fast message queries
- `sender_id` and `receiver_id` for user-specific queries
- `created_at` for chronological ordering

### Real-time Limits
- Events per second: 10 (configurable in supabase client)
- Connection pooling handled by Kong
- Efficient WebSocket management

### Query Optimization
- Messages ordered by `created_at` 
- Conversations ordered by `last_message_at`
- Proper use of WHERE clauses for filtering

## 🚀 Production Deployment

### Supabase Cloud
1. Create account at https://supabase.com
2. Create new project
3. Update environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```
4. Run database migrations in Supabase SQL Editor

### Docker Production
1. Update docker-compose.yml with production credentials
2. Use external PostgreSQL service
3. Configure proper SSL certificates
4. Set up backup strategy

## 🔐 Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies prevent unauthorized access

### Authentication Integration
- Firebase JWT tokens validate user identity
- Custom auth logic can be added to RLS policies
- API keys are properly scoped

### Network Security
- Kong API Gateway provides additional security layer
- CORS properly configured for your domain
- Database not directly exposed

## 🤝 Contributing

### Adding New Message Features

1. **Update database schema** in `supabase/sql/init.sql`
2. **Update TypeScript types** in `src/lib/supabase.ts`
3. **Extend service methods** in `src/lib/supabaseMessageService.ts`
4. **Update hooks** in `src/hooks/useMessages.ts`
5. **Test thoroughly** with Docker setup

### Testing Changes
1. `docker-compose down && docker-compose up -d`
2. Check Supabase Studio for schema changes
3. Test real-time functionality
4. Verify authentication works correctly

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Docker Compose](https://docs.docker.com/compose/)

## 🆘 Support

If you encounter issues:

1. Check this documentation first
2. Review Docker logs: `docker-compose logs`
3. Test with Supabase Studio at http://localhost:3001
4. Check browser console for errors
5. Verify environment variables are correct

Happy messaging! 🚀💬
