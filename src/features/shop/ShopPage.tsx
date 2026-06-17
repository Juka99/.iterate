import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Coins, Lock, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { RankBadge } from '@/features/ranks/RankBadge';
import { getRankForXp } from '@/features/ranks/rankUtils';
import { getRankRequirementLabel, getRankRequirementOrder, SHOP_SECTIONS } from './shopData';
import { usePurchaseShopItem } from './hooks/usePurchaseShopItem';
import { useShopPurchases } from './hooks/useShopPurchases';
import type { ShopItem, ShopPurchase, ShopSection } from './shopTypes';
import styles from './ShopPage.module.scss';

const SHOP_RANK_FILTERS = ['core', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
const ESSENCE_GAMBLE_STAKES = [250, 500, 1000, 2500] as const;
type ShopRankFilter = (typeof SHOP_RANK_FILTERS)[number];

function getPurchaseCountByItemId(purchases: ShopPurchase[]) {
  return purchases.reduce<Record<string, number>>((counts, purchase) => {
    counts[purchase.item_id] = (counts[purchase.item_id] ?? 0) + 1;
    return counts;
  }, {});
}

interface ShopItemCardProps {
  currentRankOrder: number;
  essenceBalance: number;
  isBuying: boolean;
  item: ShopItem;
  onBuy: (item: ShopItem, configuredCost?: number) => void;
  purchaseCount: number;
  sectionLocked: boolean;
  supersededBy?: string;
}

function ShopItemCard({ currentRankOrder, essenceBalance, isBuying, item, onBuy, purchaseCount, sectionLocked, supersededBy }: ShopItemCardProps) {
  const itemLocked = currentRankOrder < getRankRequirementOrder(item.rankRequirement);
  const isVariableCost = item.cost === null;
  const isOwned = !item.repeatable && purchaseCount > 0;
  const isSuperseded = Boolean(supersededBy);
  const isAffordable = item.cost !== null && essenceBalance >= item.cost;
  const canBuy = !itemLocked && !isOwned && !isSuperseded && (isVariableCost || isAffordable);
  const buttonLabel = isSuperseded
    ? `${supersededBy} Owned`
    : isOwned
    ? 'Owned'
    : itemLocked
      ? 'Locked'
      : isVariableCost
        ? 'Configure'
        : isAffordable
          ? 'Buy'
          : 'Need Essence';

  return (
    <article className={`${styles.itemCard} ${sectionLocked ? styles.previewItem : ''} ${isSuperseded ? styles.supersededItem : ''}`}>
      <div className={styles.itemMedia}>
        <img alt="" src={item.image} />
        {itemLocked && (
          <span className={styles.itemLock}>
            <Lock />
          </span>
        )}
      </div>
      <div className={styles.itemBody}>
        <div className={styles.itemMeta}>
          <Badge tone={item.repeatable ? 'info' : 'success'}>{item.repeatable ? 'Repeatable' : 'Permanent'}</Badge>
          <span className={styles.costTag}>
            <Coins />
            {item.costLabel ?? item.cost?.toLocaleString()}
          </span>
        </div>
        <h3>{item.name}</h3>
        <small>{item.effect}</small>
        {isSuperseded && (
          <span className={styles.supersededNote}>
            <Sparkles />
            Your SSS Living Nameplate already includes the stronger version of this cosmetic.
          </span>
        )}
      </div>
      <div className={styles.itemActions}>
        {purchaseCount > 0 && item.repeatable && <span className={styles.purchaseCount}>Purchased x{purchaseCount}</span>}
        <Button
          disabled={!canBuy || isBuying}
          icon={isOwned || isSuperseded ? <CheckCircle /> : itemLocked ? <Lock /> : <ShoppingBag />}
          onClick={() => onBuy(item)}
          variant={canBuy ? 'primary' : isOwned || isSuperseded ? 'secondary' : 'ghost'}
        >
          {isBuying ? 'Buying' : buttonLabel}
        </Button>
      </div>
    </article>
  );
}

interface ShopSectionViewProps {
  currentRankOrder: number;
  essenceBalance: number;
  onBuy: (item: ShopItem, configuredCost?: number) => void;
  pendingItemId?: string;
  purchaseCounts: Record<string, number>;
  section: ShopSection;
}

function ShopSectionView({ currentRankOrder, essenceBalance, onBuy, pendingItemId, purchaseCounts, section }: ShopSectionViewProps) {
  const requiredRankOrder = getRankRequirementOrder(section.rankRequirement);
  const isLocked = currentRankOrder < requiredRankOrder;

  return (
    <Card className={`${styles.sectionCard} ${isLocked ? styles.lockedSection : ''}`}>
      <div className={styles.sectionHeader}>
        <div>
          <p>{section.arsenalName}</p>
          <h2>{section.title}</h2>
          <span>{section.description}</span>
        </div>
        <div className={styles.sectionStatus}>
          {section.rankRequirement !== 'core' && <RankBadge rank={section.rankRequirement} size="sm" />}
          <Badge tone={isLocked ? 'danger' : 'success'}>{isLocked ? getRankRequirementLabel(section.rankRequirement) : 'Unlocked'}</Badge>
        </div>
      </div>
      <div className={styles.itemGrid}>
        {section.items.map((item) => {
          const supersededBy = item.id === 'paragon-nameplate' && (purchaseCounts['living-nameplate'] ?? 0) > 0 ? 'Living Nameplate' : undefined;

          return (
            <ShopItemCard
              currentRankOrder={currentRankOrder}
              essenceBalance={essenceBalance}
              isBuying={pendingItemId === item.id}
              item={item}
              key={item.id}
              onBuy={onBuy}
              purchaseCount={purchaseCounts[item.id] ?? 0}
              sectionLocked={isLocked}
              supersededBy={supersededBy}
            />
          );
        })}
      </div>
    </Card>
  );
}

export function ShopPage() {
  const { user } = useAuthSession();
  const { data: profile, error: profileError, isLoading: isProfileLoading } = useProfile(user?.id);
  const { data: purchases = [], error: purchasesError, isLoading: arePurchasesLoading } = useShopPurchases(user?.id);
  const purchaseShopItem = usePurchaseShopItem();
  const exitAnimationTimeout = useRef<number | undefined>(undefined);
  const [pendingItemId, setPendingItemId] = useState<string | undefined>();
  const [selectedRankFilter, setSelectedRankFilter] = useState<ShopRankFilter>('core');
  const [displayedRankFilter, setDisplayedRankFilter] = useState<ShopRankFilter>('core');
  const [exitingSection, setExitingSection] = useState<ShopSection | null>(null);
  const [configuringItem, setConfiguringItem] = useState<ShopItem | null>(null);
  const currentRank = getRankForXp(profile?.total_xp ?? 0);
  const essenceBalance = profile?.essence_balance ?? 0;
  const purchaseCounts = useMemo(() => getPurchaseCountByItemId(purchases), [purchases]);
  const visibleSection = useMemo(() => SHOP_SECTIONS.find((section) => section.rankRequirement === displayedRankFilter) ?? SHOP_SECTIONS[0], [displayedRankFilter]);

  useEffect(() => {
    return () => {
      if (exitAnimationTimeout.current) {
        window.clearTimeout(exitAnimationTimeout.current);
      }
    };
  }, []);

  function handleShopFilterSelect(rank: ShopRankFilter) {
    if (rank === selectedRankFilter) {
      return;
    }

    const currentSection = SHOP_SECTIONS.find((section) => section.rankRequirement === displayedRankFilter) ?? SHOP_SECTIONS[0];

    if (exitAnimationTimeout.current) {
      window.clearTimeout(exitAnimationTimeout.current);
    }

    setSelectedRankFilter(rank);
    setExitingSection(currentSection);
    setDisplayedRankFilter(rank);
    exitAnimationTimeout.current = window.setTimeout(() => setExitingSection(null), 340);
  }

  async function handleBuy(item: ShopItem, configuredCost?: number) {
    if (!user) {
      return;
    }

    if (item.cost === null && configuredCost === undefined) {
      setConfiguringItem(item);
      return;
    }

    setPendingItemId(item.id);

    try {
      await purchaseShopItem.mutateAsync({ configuredCost, itemId: item.id, userId: user.id });
      toast.success(`${item.name} acquired`, {
        description: item.repeatable ? 'The item was added to your inventory.' : 'The permanent cosmetic is now active.',
      });
      setConfiguringItem(null);
    } catch (purchaseError) {
      toast.error('Purchase failed', {
        description: purchaseError instanceof Error ? purchaseError.message : 'Item could not be purchased.',
      });
    } finally {
      setPendingItemId(undefined);
    }
  }

  const isLoading = isProfileLoading || arePurchasesLoading;
  const hasError = profileError || purchasesError;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p>Hunter&apos;s Armory</p>
          <h1>Shop</h1>
          <span>Spend Essence on progression tools, rank arsenals, and prestige artifacts.</span>
        </div>
        <dl className={styles.wallet}>
          <div>
            <dt>Essence</dt>
            <dd>
              <Coins />
              {essenceBalance.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>
              <Sparkles />
              Rank {currentRank.name}
            </dd>
          </div>
        </dl>
      </section>

      {!isLoading && !hasError && (
        <fieldset className={styles.rankFilters}>
          <legend>Choose your shop</legend>
          <div className={styles.rankFilterOptions}>
            {SHOP_RANK_FILTERS.map((rank) => (
              <button
                className={styles.rankFilter}
                data-selected={selectedRankFilter === rank}
                key={rank}
                onClick={() => handleShopFilterSelect(rank)}
                type="button"
              >
                {rank === 'core' ? 'Core Shop' : `Rank ${rank}`}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isLoading && (
        <Card className={styles.state}>
          <Loader label="Loading armory" size="md" />
        </Card>
      )}
      {hasError && <Card className={styles.error}>Shop could not be loaded. Check the shop migration and Supabase policies.</Card>}

      {!isLoading && !hasError && (
        <div className={styles.sections}>
          <div className={styles.sectionStage}>
            {exitingSection && exitingSection.id !== visibleSection.id && (
              <div className={styles.sectionSwapOut} key={`exiting-${exitingSection.id}`}>
                <ShopSectionView
                  currentRankOrder={currentRank.order}
                  essenceBalance={essenceBalance}
                  onBuy={handleBuy}
                  pendingItemId={pendingItemId}
                  purchaseCounts={purchaseCounts}
                  section={exitingSection}
                />
              </div>
            )}
            <div className={styles.sectionSwapIn} key={visibleSection.id}>
              <ShopSectionView
                currentRankOrder={currentRank.order}
                essenceBalance={essenceBalance}
                onBuy={handleBuy}
                pendingItemId={pendingItemId}
                purchaseCounts={purchaseCounts}
                section={visibleSection}
              />
            </div>
          </div>
        </div>
      )}
      <Modal isOpen={Boolean(configuringItem)} onClose={() => setConfiguringItem(null)} title="Configure Essence Gamble">
        <div className={styles.gambleModal}>
          <p>Choose how much Essence you want to risk. You will activate the gamble from inventory after purchase.</p>
          <div className={styles.gambleOptions}>
            {ESSENCE_GAMBLE_STAKES.map((stake) => (
              <button
                className={styles.gambleOption}
                disabled={pendingItemId === configuringItem?.id || essenceBalance < stake}
                key={stake}
                onClick={() => configuringItem && handleBuy(configuringItem, stake)}
                type="button"
              >
                <span>Stake</span>
                <strong>{stake.toLocaleString()} Essence</strong>
              </button>
            ))}
          </div>
          <div className={styles.gambleFooter}>
            <Button onClick={() => setConfiguringItem(null)} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
