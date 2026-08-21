// Test script to inspect Supabase project data
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  try {
    console.log("\n=== FETCHING ALL PROJECTS ===\n");
    
    const { data, error } = await supabase
      .from("projects")
      .select("*");

    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log(`Total projects: ${data.length}\n`);

    // Display first 10 projects with relevant fields
    data.slice(0, 10).forEach((project, index) => {
      console.log(`\n--- Project ${index + 1} ---`);
      console.log("id:", project.id);
      console.log("project_code:", project.project_code);
      console.log("name:", project.name);
      console.log("sector:", project.sector);
      console.log("location:", project.location);
      console.log("latitude:", project.latitude, typeof project.latitude);
      console.log("longitude:", project.longitude, typeof project.longitude);
      console.log("status:", project.status);
      
      // Check for field variations
      const allKeys = Object.keys(project);
      const latLonKeys = allKeys.filter(k => 
        k.toLowerCase().includes("lat") || 
        k.toLowerCase().includes("lon") ||
        k.toLowerCase().includes("coord") ||
        k.toLowerCase().includes("geo")
      );
      if (latLonKeys.length > 0) {
        console.log("Other coordinate-related fields:", latLonKeys);
      }
    });

    // Search for projects containing "HEA 003"
    console.log("\n\n=== SEARCHING FOR 'HEA 003' ===\n");
    const searchTerm = "HEA 003";
    const matches = data.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(p).toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log(`Found ${matches.length} projects containing "${searchTerm}"`);
    matches.forEach(project => {
      console.log(`\nproject_code: ${project.project_code}`);
      console.log(`name: ${project.name}`);
      console.log(`location: ${project.location}`);
      console.log(`latitude: ${project.latitude}`);
      console.log(`longitude: ${project.longitude}`);
    });

    // Display all project codes and names for reference
    console.log("\n\n=== ALL PROJECT CODES AND NAMES ===\n");
    data.forEach((project, index) => {
      console.log(`${index + 1}. ${project.project_code} - ${project.name}`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

inspectData();
