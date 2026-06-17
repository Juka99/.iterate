import { useState } from 'react';
import { Backpack, CheckCircle, Clock, Gift, Layers, PackageOpen, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { SPECIALIZATION_PATHS, type SpecializationPath, isSpecializationPath } from '@/features/challenges/specializationPaths';
import type { InventoryEntry } from './inventoryTypes';
import { useActivateInventoryItem, useInventory } from './hooks/useInventory';
import styles from './InventoryPage.module.scss';

function getItemKindLabel(kind: InventoryEntry['item']['kind']) {
  return {
    boost: 'Boost',
    contract: 'Contract',
    key: 'Key',
    prestige: 'Permanent',
    protection: 'Protection',
    trial: 'Trial',
    utility: 'Utility',
  }[kind];
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getEffectStatusLabel(entry: { activation: { expires_at: string | null; metadata: unknown }; item: InventoryEntry['item'] }) {
  if (entry.activation.expires_at) {
    return `Expires ${formatExpiry(entry.activation.expires_at)}`;
  }

  switch (entry.item.id) {
    case 'bonus-challenge-scroll':
      return 'Adds one extra daily challenge until reset.';
    case 'double-xp-sigil':
      return 'Your next completed challenge grants double XP.';
    case 'challenge-reroll-token':
      return 'One daily challenge is rerolled until reset.';
    case 'elite-contract':
      return 'One easy daily challenge is upgraded until reset.';
    case 'challenge-chain':
      return 'The next three completed challenges gain +50% XP before reset.';
    case 'streak-shield':
      return 'Protects your next broken streak.';
    case 'momentum-crystal':
      return 'Protects your next broken streak and boosts its Essence reward.';
    case 'hunters-oath':
      if (
        entry.activation.metadata &&
        typeof entry.activation.metadata === 'object' &&
        'category' in entry.activation.metadata &&
        isSpecializationPath(entry.activation.metadata.category as string)
      ) {
        return `${entry.activation.metadata.category} oath active for seven days.`;
      }

      return 'Your chosen oath path is active for seven days.';
    case 'legendary-contract':
      return 'Your next completed challenge becomes a legendary reward burst.';
    case 'goblin-kings-gate-key':
    case 'deep-work-gate-key':
    case 'iron-trial-key':
    case 'trial-of-ascension':
    case 'legendary-trial':
    case 'mythic-trial':
    case 'master-boss-key':
      return 'An exclusive weekly challenge is unlocked while this activation lasts.';
    default:
      return 'Always active.';
  }
}

function InventoryItemCard({
  entry,
  isActivating,
  onActivate,
}: {
  entry: InventoryEntry;
  isActivating: boolean;
  onActivate: (entry: InventoryEntry) => void;
}) {
  const isPermanent = entry.item.kind === 'prestige';
  const canActivate = !isPermanent && entry.activatableCount > 0 && !entry.isBlockedByActive;
  const buttonLabel = isPermanent ? 'Owned' : entry.isBlockedByActive ? 'Already active' : isActivating ? 'Activating' : 'Activate';

  return (
    <article className={styles.itemCard}>
      <div
        className={styles.itemImage}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 48%, rgb(34 211 238 / 0.16), transparent 54%), url("${entry.item.image}")`,
        }}
      >
        <span>x{entry.availableCount}</span>
      </div>
      <div className={styles.itemBody}>
        <div className={styles.itemMeta}>
          <Badge tone={isPermanent ? 'success' : 'info'}>{getItemKindLabel(entry.item.kind)}</Badge>
          {entry.item.rankRequirement !== 'core' && <Badge tone="warning">Rank {entry.item.rankRequirement}</Badge>}
        </div>
        <h3>{entry.item.name}</h3>
        <p>{entry.item.effect}</p>
        <dl className={styles.itemCounts}>
          <div>
            <dt>Ready</dt>
            <dd>{entry.activatableCount}</dd>
          </div>
          <div>
            <dt>Acquired</dt>
            <dd>{entry.acquiredCount}</dd>
          </div>
          {!isPermanent && (
            <div>
              <dt>Used</dt>
              <dd>{entry.activatedCount}</dd>
            </div>
          )}
        </dl>
        {entry.isBlockedByActive && <span className={styles.itemHint}>An activation of this item is already running.</span>}
      </div>
      <div className={styles.itemActions}>
        <Button
          disabled={!canActivate || isActivating}
          icon={isPermanent ? <CheckCircle /> : <Zap />}
          onClick={() => onActivate(entry)}
          variant={canActivate ? 'primary' : 'ghost'}
        >
          {buttonLabel}
        </Button>
      </div>
    </article>
  );
}

export function InventoryPage() {
  const { user } = useAuthSession();
  const { data: inventory, error, isLoading } = useInventory(user?.id);
  const activateItem = useActivateInventoryItem(user?.id);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [configuringEntry, setConfiguringEntry] = useState<InventoryEntry | null>(null);
  const [selectedOathPath, setSelectedOathPath] = useState<SpecializationPath>('Focus');
  const entries = inventory?.entries ?? [];
  const activeEffects = inventory?.activeEffects ?? [];

  async function activateEntry(entry: InventoryEntry, option?: string) {
    setPendingItemId(entry.item.id);

    try {
      const activation = await activateItem.mutateAsync({ itemId: entry.item.id, option });

      if (entry.item.id === 'essence-gamble' && activation.metadata && typeof activation.metadata === 'object') {
        const gambleResult = activation.metadata as { payout?: number; result?: string };

        const description =
          gambleResult.result === 'success'
            ? `${entry.item.name} paid out ${Number(gambleResult.payout ?? 0).toLocaleString()} Essence.`
            : `${entry.item.name} failed. The stake was lost.`;

        if (gambleResult.result === 'success') {
          toast.success('Gamble won', { description });
        } else {
          toast.warning('Gamble lost', { description });
        }
      } else if (entry.item.id === 'hunters-oath' && option) {
        toast.success(`${entry.item.name} activated`, { description: `Bound to the ${option} path.` });
      } else {
        toast.success(`${entry.item.name} activated`);
      }
    } catch (activationError) {
      toast.error('Activation failed', {
        description: activationError instanceof Error ? activationError.message : 'Item could not be activated.',
      });
    } finally {
      setPendingItemId(null);
      setConfiguringEntry(null);
    }
  }

  async function handleActivate(entry: InventoryEntry) {
    if (entry.item.id === 'hunters-oath') {
      setSelectedOathPath('Focus');
      setConfiguringEntry(entry);
      return;
    }

    await activateEntry(entry);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <Backpack />
        </div>
        <div>
          <p>Stored rewards</p>
          <h1>Inventory</h1>
          <span>Review items earned from achievements or bought in the Shop, then activate usable stacks when you need them.</span>
        </div>
        <dl className={styles.heroStats}>
          <div>
            <dt>Stacks</dt>
            <dd>{entries.length}</dd>
          </div>
          <div>
            <dt>Items</dt>
            <dd>{inventory?.totalAvailable ?? 0}</dd>
          </div>
        </dl>
      </section>

      {isLoading && (
        <Card className={styles.state}>
          <Loader label="Loading inventory" size="md" />
        </Card>
      )}
      {error && <Card className={styles.error}>Inventory could not be loaded. Check the inventory migration and Supabase policies.</Card>}

      {!isLoading && !error && activeEffects.length > 0 && (
        <Card className={styles.activeCard} eyebrow="Currently active" title="Active Effects">
          <div className={styles.activeList}>
            {activeEffects.map((effect) => (
              <article key={effect.activation.id}>
                <Sparkles />
                <div>
                  <strong>{effect.item.name}</strong>
                  <span>{getEffectStatusLabel(effect)}</span>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !error && entries.length === 0 && activeEffects.length === 0 && (
        <Card className={styles.emptyCard}>
          <PackageOpen />
          <div>
            <h2>No current items</h2>
            <p>Items you buy in the Shop or earn from Achievements will appear here as stackable inventory.</p>
          </div>
        </Card>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <section className={styles.itemGrid}>
          {entries.map((entry) => (
            <InventoryItemCard
              entry={entry}
              isActivating={pendingItemId === entry.item.id}
              key={entry.item.id}
              onActivate={handleActivate}
            />
          ))}
        </section>
      )}

      {!isLoading && !error && (
        <Card className={styles.noteCard} eyebrow="How inventory works" title="Stacks and Activation">
          <div className={styles.noteGrid}>
            <article>
              <Layers />
              <span>Duplicates stack</span>
              <strong>One card per item</strong>
            </article>
            <article>
              <Gift />
              <span>Sources</span>
              <strong>Shop and achievement rewards</strong>
            </article>
            <article>
              <Clock />
              <span>Timed boosts</span>
              <strong>24 hour effects show above</strong>
            </article>
          </div>
        </Card>
      )}
      <Modal isOpen={Boolean(configuringEntry)} onClose={() => setConfiguringEntry(null)} title="Bind Hunter's Oath">
        <div className={styles.optionModal}>
          <p>Choose the category this oath will empower for the next seven days.</p>
          <div className={styles.optionGrid}>
            {SPECIALIZATION_PATHS.map((path) => (
              <button
                className={styles.optionCard}
                data-selected={selectedOathPath === path.id}
                key={path.id}
                onClick={() => setSelectedOathPath(path.id)}
                type="button"
              >
                <strong>{path.id}</strong>
                <span>{path.description}</span>
              </button>
            ))}
          </div>
          <div className={styles.optionFooter}>
            <Button onClick={() => setConfiguringEntry(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!configuringEntry || pendingItemId === configuringEntry.item.id}
              onClick={() => configuringEntry && activateEntry(configuringEntry, selectedOathPath)}
            >
              {pendingItemId === configuringEntry?.item.id ? 'Binding' : 'Bind oath'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
