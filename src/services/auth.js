const authSvc = {};
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vpxpkpyajjkxkymeqysg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweHBrcHlhampreGt5bWVxeXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwODM3ODIsImV4cCI6MjA1NDY1OTc4Mn0.U-CU7PNB5KbuY6okjlH2EHEH5zw23k6co0da4tuDLyM';

let supabase;

authSvc.createClient = () => {
    const supabaseClientExits = supabase != null && supabase != undefined;
    if(supabaseClientExits) {
        return supabase;
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
};

module.exports = authSvc;