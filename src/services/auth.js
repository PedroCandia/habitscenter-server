const authSvc = {};
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xfkqstoimowntlkgeadm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma3FzdG9pbW93bnRsa2dlYWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQyMjMzMjQsImV4cCI6MjAxOTc5OTMyNH0.EAOb6ZZhNpScerfzbCt-3jJ53x-tfEtRQnKufYln5qg';

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