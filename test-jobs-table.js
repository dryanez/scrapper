import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mszpskizddxiutgugezz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenBza2l6ZGR4aXV0Z3VnZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDE0NTcsImV4cCI6MjA4MDE3NzQ1N30.N4vUK9bI13i28BOTKH1udy8HlWap3t6QEg8YGHmx1mQ'
);

async function testWithRealHospital() {
  try {
    // Get a real hospital ID first
    const { data: hospitals } = await supabase.from('hospitals').select('id, name').limit(1);
    
    if (!hospitals || hospitals.length === 0) {
      console.log('❌ No hospitals found');
      return;
    }
    
    const hospital = hospitals[0];
    console.log('Using hospital:', hospital.name, '(ID:', hospital.id + ')');
    
    // Try creating a job
    const testJob = {
      title: 'Test Assistenzarzt Position',
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      city: 'Berlin',
      state: 'BE',
      specialty: 'Allgemein',
      seniority: 'Assistenzarzt',
      description_html: '<p>Test job description</p>',
      job_details_url: 'https://test.example.com/job/' + Date.now(),
      source: 'test',
      posted_at: new Date().toISOString()
    };
    
    console.log('\nCreating test job...');
    const { data, error } = await supabase
      .from('jobs')
      .insert([testJob])
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ SUCCESS! Job created with ID:', data[0].id);
    console.log('\n📋 Job table columns:');
    console.log(Object.keys(data[0]).sort().join('\n'));
    
    // Clean up
    await supabase.from('jobs').delete().eq('id', data[0].id);
    console.log('\n✅ Test job cleaned up');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testWithRealHospital();
