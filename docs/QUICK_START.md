# Quick Start Guide - Chat Module

## Prerequisites
- ✅ Node.js installed
- ✅ Supabase project created
- ✅ OpenAI API key
- ✅ OpenRouter API key

## 5-Minute Setup

### 1. Database (2 minutes)
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy and paste: Dabby-Backend/supabase/migrations/003_chat_module.sql
-- Click "Run"
```

### 2. Storage Bucket (1 minute)
```
1. Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: "chat-files"
4. Public: OFF (private)
5. Click "Create bucket"
```

### 3. Backend Environment (1 minute)
```bash
cd Dabby-Backend

# Create/edit .env file
echo "OPENAI_API_KEY=sk-proj-YOUR_KEY" >> .env
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY" >> .env
echo "OPENROUTER_MODEL=openai/gpt-4-turbo-preview" >> .env
echo "SUPABASE_URL=https://YOUR_PROJECT.supabase.co" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY" >> .env
echo "APP_URL=http://localhost:3000" >> .env
echo "PORT=3001" >> .env
```

### 4. Frontend Environment (30 seconds)
```bash
cd Dabby

# Create/edit .env
echo "VITE_API_URL=http://localhost:3001" >> .env
```

### 5. Start Servers (30 seconds)
```bash
# Terminal 1 - Backend
cd Dabby-Backend
npm run dev

# Terminal 2 - Frontend
cd Dabby
npm run dev
```

## Test It!

1. Open browser: `http://localhost:5173`
2. Login to your account
3. Type a message: "Hello Dabby!"
4. See AI response
5. Click paperclip → Upload a PDF
6. Wait for "Analysis complete"
7. Ask: "What's in this file?"
8. Get context-aware response!

## Troubleshooting

### Backend won't start
- Check `.env` file exists in `Dabby-Backend/`
- Verify all API keys are set
- Check port 3001 is not in use

### Frontend won't connect
- Check `VITE_API_URL` in `Dabby/.env`
- Verify backend is running on port 3001
- Check browser console for errors

### No AI response
- Verify `OPENROUTER_API_KEY` is correct
- Check backend logs for errors
- Ensure model name is correct

### File upload fails
- Verify `chat-files` bucket exists in Supabase
- Check `OPENAI_API_KEY` is set (for embeddings)
- Check file size < 10MB
- Verify file type is supported

## API Keys

### OpenAI
Get from: https://platform.openai.com/api-keys
- Used for: Text embeddings (vectorization)
- Model: `text-embedding-ada-002`

### OpenRouter
Get from: https://openrouter.ai/keys
- Used for: Chat completions (AI responses)
- Model: `openai/gpt-4-turbo-preview` (or any other)

### Supabase
Get from: Supabase Dashboard → Settings → API
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (secret!)

## That's It!

You now have a fully functional AI chat with:
- ✅ Real-time messaging
- ✅ File upload and analysis
- ✅ RAG-based responses
- ✅ Context-aware AI

Enjoy chatting with Dabby Consultant! 🎉
