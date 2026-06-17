import { Hammer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { GuildProjectWithRequirements } from '../guildTypes';
import styles from '../GuildPage.module.scss';

interface GuildProjectCardProps {
  canStart: boolean;
  isStarting: boolean;
  onStart: () => void;
  project: GuildProjectWithRequirements | null;
}

export function GuildProjectCard({ canStart, isStarting, onStart, project }: GuildProjectCardProps) {
  return (
    <Card
      className={styles.projectCard}
      eyebrow="Guild project"
      title={project?.name ?? 'No active project'}
      actions={
        canStart && !project ? (
          <Button onClick={onStart} variant="secondary">
            {isStarting ? 'Starting' : 'Start project'}
          </Button>
        ) : null
      }
    >
      <div className={styles.projectPanel}>
        <Hammer />
        {project ? (
          <div className={styles.projectRequirements}>
            <p>{project.description}</p>
            {project.requirements.map((requirement) => {
              const percent = Math.min(Math.max((requirement.current_amount / requirement.required_amount) * 100, 0), 100);

              return (
                <div className={styles.projectRequirement} key={requirement.id}>
                  <div>
                    <span>{requirement.category}</span>
                    <strong>
                      {requirement.current_amount} / {requirement.required_amount}
                    </strong>
                  </div>
                  <div className={styles.projectTrack}>
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Start a shared construction goal so every matching challenge helps build something permanent.</p>
        )}
      </div>
    </Card>
  );
}
