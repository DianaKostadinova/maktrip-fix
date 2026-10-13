// Feature flags, read from runtime/build config. Flip PLANNER_ENABLED=true (in
// .env or the container environment) to switch the AI trip planner on.
import { features } from '../config/env';

export const featureService = {
    plannerEnabled: () => features.planner,
};
