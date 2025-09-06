// DEV-ONLY seed for Teams feature. Run from browser console in DEV:
//   import('./src/scripts/seed-teams').then(m => m.seedTeams())
// Requires you to be authenticated so we can attribute followers/members if needed.

import { supabase } from '../integrations/supabase/client';

export async function seedTeams() {
  if (!import.meta.env.DEV) {
    console.warn('seedTeams can only run in DEV');
    return;
  }

  // Create a few demo teams
  const teams = [
    {
      team_name: 'Thunder Racing',
      description: 'High-octane performance team with a passion for winning.',
      logo_url: null,
      banner_url: null,
      website: 'https://thunderracing.example.com',
      social_links: { twitter: 'https://twitter.com/thunderracing' },
      racing_classes: ['Pro Stock', 'Late Model'],
    },
    {
      team_name: 'Apex Motorsports',
      description: 'Precision engineering meets fearless driving.',
      logo_url: null,
      banner_url: null,
      website: 'https://apexmotorsports.example.com',
      social_links: { instagram: 'https://instagram.com/apexmotorsports' },
      racing_classes: ['Sprint', 'Dirt'],
    },
  ];

  const { data: insertedTeams, error: teamErr } = await supabase
    .from('teams')
    .insert(teams)
    .select('id, team_name');

  if (teamErr) {
    console.error('Failed to insert teams', teamErr);
    return;
  }

  console.log('Inserted teams:', insertedTeams);

  // If you have racer ids available, add a couple of members per team
  // For demo, we will skip adding real racer_ids unless you provide them here
  // Example:
  // const demoRacerIds = ['<uuid-1>', '<uuid-2>'];
  // for (const t of insertedTeams || []) {
  //   for (const r of demoRacerIds) {
  //     await supabase.from('team_members').insert({ team_id: t.id, racer_id: r, role: 'member' });
  //   }
  // }

  // Follow the first team as the current user (if logged in)
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (userId && insertedTeams && insertedTeams.length > 0) {
    const firstTeamId = insertedTeams[0].id as string;
    await supabase.from('team_followers').insert({ team_id: firstTeamId, user_id: userId });
    console.log('Followed team', firstTeamId);
  }

  console.log('Seed complete');
}
