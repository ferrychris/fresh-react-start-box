import React from 'react';
import { RacerDashboard } from '../components/racer-dashboard/IndexRacer';

// Thin wrapper so the pages route uses the exact same UI as the racer dashboard component
const Dashboard: React.FC = () => {
  return <RacerDashboard />;
};

export { Dashboard };
export default Dashboard;
