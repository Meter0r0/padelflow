const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// We need to use tsx to run the typescript module directly
console.log("Creating test runner script for TSX...");
