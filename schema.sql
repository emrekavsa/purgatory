CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  isbanned BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_type TEXT CHECK (option_type IN ('text', 'image')) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id)
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);