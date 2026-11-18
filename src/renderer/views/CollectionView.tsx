import { useEffect, useState } from 'react';
import { BookOpen, History, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { ItemCategory, ItemRarity } from '@shared/types/domain';
import { PixelSprite } from '../components/garden/PixelSprite';
import { useAppStore } from '../stores/useAppStore';
import { useProgressionStore } from '../stores/useProgressionStore';

type CollectionTab = 'exchange' | 'journal';
type CategoryFilter = 'all' | Exclude<ItemCategory, 'ticket'>;

const CATEGORY_TABS: ReadonlyArray<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'plant', label: 'Plants' },
  { id: 'seed', label: 'Seeds' },
  { id: 'tool', label: 'Tools' },
  { id: 'technology', label: 'Technologies' },
  { id: 'decor', label: 'Decor' }
];

const RARITY_CLASSES: Record<ItemRarity, string> = {
  common: 'bg-cozy-panel text-cozy-wood border-cozy-border',
  uncommon: 'bg-cozy-meadow text-cozy-sage-dark border-cozy-sage/40',
  rare: 'bg-sky-50 text-sky-700 border-sky-200',
  epic: 'bg-purple-50 text-purple-700 border-purple-200'
};

export function CollectionView() {
  const catalog = useProgressionStore((s) => s.catalog);
  const transactions = useProgressionStore((s) => s.transactions);
  const gardenAreas = useProgressionStore((s) => s.gardenAreas);
  const exchangingItemId = useProgressionStore((s) => s.exchangingItemId);
  const progressionError = useProgressionStore((s) => s.progressionError);
  const actionBanner = useProgressionStore((s) => s.actionBanner);
  const loadCollectionData = useProgressionStore((s) => s.loadCollectionData);
  const exchangeItem = useProgressionStore((s) => s.exchangeItem);
  const clearActionBanner = useProgressionStore((s) => s.clearActionBanner);

  const xpBalance = useAppStore((s) => s.progression?.xpBalance ?? 0);

  const [activeTab, setActiveTab] = useState<CollectionTab>('exchange');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    void loadCollectionData();
  }, [loadCollectionData]);

  const filteredCatalog = catalog.filter((item) =>
    categoryFilter === 'all' ? true : item.category === categoryFilter
  );
  const ownedItems = catalog.filter((item) => item.ownedQuantity > 0);
  const unlockedGardens = gardenAreas.filter((g) => g.isUnlocked).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <BookOpen className="h-3.5 w-3.5" />
            Collection &amp; XP Exchange
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
            Plants, Seeds, Tools &amp; Garden Journal
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-cozy-border bg-white px-4 py-2 shadow-pixel-sm">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-cozy-muted">Available XP:</span>
          <span className="font-mono text-base font-bold text-cozy-ink">{xpBalance} XP</span>
        </div>
      </header>

      {progressionError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {progressionError}
        </div>
      )}

      {actionBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-cozy-sage/50 bg-cozy-meadow/80 px-5 py-3 text-xs font-semibold text-cozy-wood"
        >
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={clearActionBanner}
            className="rounded-lg p-1 text-cozy-muted hover:bg-white/60"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main View Tabs */}
      <div className="inline-flex rounded-xl border border-cozy-border bg-cozy-panel p-1">
        <button
          type="button"
          onClick={() => setActiveTab('exchange')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'exchange'
              ? 'bg-cozy-sage text-white shadow-pixel-sm'
              : 'text-cozy-wood hover:bg-white/60'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>XP Exchange Catalog</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'journal'
              ? 'bg-cozy-sage text-white shadow-pixel-sm'
              : 'text-cozy-wood hover:bg-white/60'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Collection Journal &amp; Ledger</span>
        </button>
      </div>

      {activeTab === 'exchange' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-cozy-sage bg-cozy-meadow text-cozy-sage-dark'
                      : 'border-cozy-border bg-white/80 text-cozy-wood hover:bg-cozy-panel'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatalog.map((item) => {
              const cost = item.xpCost ?? 0;
              const canAfford = xpBalance >= cost;
              const busy = exchangingItemId === item.itemId;

              return (
                <div key={item.itemId} className="cozy-card flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cozy-border bg-cozy-cream">
                        <PixelSprite spriteKey={item.spriteKey} size={42} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RARITY_CLASSES[item.rarity]}`}
                        >
                          {item.rarity}
                        </span>
                        <span className="text-[11px] font-medium capitalize text-cozy-muted">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-cozy-wood">{item.name}</h3>
                    <p className="mt-1 text-xs text-cozy-muted">{item.description}</p>
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-cozy-border/70 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cozy-muted">
                        Owned: <strong className="text-cozy-ink">{item.ownedQuantity}</strong> (Avail:{' '}
                        {item.availableQuantity})
                      </span>
                      <span className="font-mono font-bold text-amber-700">{cost} XP</span>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || busy}
                      onClick={() => void exchangeItem(item.itemId, 1)}
                      className="cozy-btn-primary w-full py-2 text-xs"
                    >
                      {busy
                        ? 'Exchanging...'
                        : canAfford
                          ? `Exchange for ${cost} XP`
                          : `Need ${cost - xpBalance} more XP`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Discovery Summary */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="cozy-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
                Items Discovered
              </p>
              <p className="mt-1.5 text-2xl font-bold text-cozy-sage-dark">
                {ownedItems.length} / {catalog.length}
              </p>
            </div>
            <div className="cozy-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
                Garden Areas Unlocked
              </p>
              <p className="mt-1.5 text-2xl font-bold text-cozy-wood">
                {unlockedGardens} / {gardenAreas.length}
              </p>
            </div>
            <div className="cozy-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
                Total Collectibles Owned
              </p>
              <p className="mt-1.5 text-2xl font-bold text-cozy-ink">
                {ownedItems.reduce((acc, i) => acc + i.ownedQuantity, 0)}
              </p>
            </div>
          </section>

          {/* Owned Journal Grid */}
          <section className="cozy-card space-y-3 p-5">
            <h3 className="text-sm font-bold text-cozy-wood">Discovered Collectibles</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ownedItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center gap-3 rounded-xl border border-cozy-border bg-cozy-cream/70 p-3"
                >
                  <PixelSprite spriteKey={item.spriteKey} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-cozy-wood">{item.name}</p>
                    <p className="text-[11px] capitalize text-cozy-muted">
                      {item.category} · Owned: {item.ownedQuantity}
                    </p>
                    {item.firstAcquiredAt && (
                      <p className="text-[10px] text-cozy-muted">
                        First acquired: {item.firstAcquiredAt.slice(0, 10)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* XP Transaction Ledger */}
          <section className="cozy-card space-y-3 p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-cozy-sage-dark" />
              <h3 className="text-sm font-bold text-cozy-wood">XP Transaction History</h3>
            </div>

            {transactions.length === 0 ? (
              <p className="py-4 text-center text-xs text-cozy-muted">
                No XP transactions yet. Complete a focus session or daily goal!
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cozy-border/80 bg-cozy-cream/70 px-4 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-cozy-wood">{tx.description}</p>
                      <p className="text-[11px] text-cozy-muted">
                        {tx.sourceType.replace('_', ' ')} · {tx.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span
                        className={`font-bold ${
                          tx.deltaXp >= 0 ? 'text-cozy-sage-dark' : 'text-cozy-peach'
                        }`}
                      >
                        {tx.deltaXp >= 0 ? `+${tx.deltaXp}` : tx.deltaXp} XP
                      </span>
                      <span className="text-cozy-muted">Bal: {tx.balanceAfter} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

