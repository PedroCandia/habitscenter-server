const authSvc = {};
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqottirsikspzaraikuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxb3R0aXJzaWtzcHphcmFpa3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NTg1MzEsImV4cCI6MjA0NTIzNDUzMX0._RqG_oFe6r3VRDikcuyvc4ExYXtQI57tsBOhI1zI-FQ';

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