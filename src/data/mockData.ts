import climateTech from '../../data/newsletters/climate-tech.json';
import aiInEducation from '../../data/newsletters/ai-in-education.json';
import healthcareInnovation from '../../data/newsletters/healthcare-innovation.json';
import humanRobotics from '../../data/newsletters/human-robotics.json';
import whaleMigration from '../../data/newsletters/whale-migration.json';
import type { Newsletter } from '../types/types';

export const mockSummaries: Record<string, Newsletter> = {
  "climate tech": climateTech as Newsletter,
  "ai in education": aiInEducation as Newsletter,
  "healthcare innovation": healthcareInnovation as Newsletter,
  "human robotics": humanRobotics as Newsletter,
  "whale migration": whaleMigration as Newsletter,
};
