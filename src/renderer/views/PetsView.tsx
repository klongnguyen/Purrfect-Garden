import { useEffect, useState } from 'react';
import type { PetRarity } from '@shared/types/domain';
import { PetIllustration, PixelSprite } from '../components/garden/PixelSprite';
import { PixelIcon } from '../components/ui/PixelIcon';
import { useAppStore } from '../stores/useAppStore';
import { usePetStore } from '../stores/usePetStore';

type SpeciesFilter = 'all' | 'cat' | 'dog' | 'capybara';

const SPECIES_FILTERS: ReadonlyArray<{ id: SpeciesFilter; label: string }> = [
  { id: 'all', label: 'All Friends' },
  { id: 'cat', label: 'Cats' },
  { id: 'dog', label: 'Dogs' },
  { id: 'capybara', label: 'Capybaras' }
];

const RARITY_BADGE_CLASSES: Record<PetRarity, string> = {
  common: 'bg-[#E5E7EB] text-[#1F2937] border-[#4B5563]',
  rare: 'bg-[#DBEAFE] text-[#1E3A8A] border-[#3B82F6]',
  epic: 'bg-[#F3E8FF] text-[#581C87] border-[#9333EA]',
  legendary: 'bg-[#FEF08A] text-[#713F12] border-[#CA8A04]'
};

const SPECIES_FRAME_BG: Record<'cat' | 'dog' | 'capybara', string> = {
  cat: 'bg-[#7A7E81] border-[#303238]',
  dog: 'bg-[#FFFFFF] border-[#303238]',
  capybara: 'bg-[#ECCCB0] border-[#303238]'
};

export function PetsView() {
  const gachaState = usePetStore((s) => s.gachaState);
  const isRolling = usePetStore((s) => s.isRolling);
  const lastRollResult = usePetStore((s) => s.lastRollResult);
  const petError = usePetStore((s) => s.petError);
  const petBanner = usePetStore((s) => s.petBanner);
  const loadGachaState = usePetStore((s) => s.loadGachaState);
  const rollGacha = usePetStore((s) => s.rollGacha);
  const togglePetPlacement = usePetStore((s) => s.togglePetPlacement);
  const updatePetNickname = usePetStore((s) => s.updatePetNickname);
  const clearRollBanner = usePetStore((s) => s.clearRollBanner);

  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');

  useEffect(() => {
    void loadGachaState();
  }, [loadGachaState]);

  const catalog = gachaState?.catalog ?? [];
  const filteredCatalog = catalog.filter((p) =>
    speciesFilter === 'all' ? true : p.species === speciesFilter
  );
  const ownedCount = catalog.filter((p) => p.isOwned).length;
  const placedCount = catalog.filter((p) => p.placedGardenId !== null).length;

  const ticketCount = gachaState?.ticketCount ?? 0;
  const xpBalance = gachaState?.xpBalance ?? 0;
  const ticketCost = gachaState?.ticketCost ?? 1;
  const xpCost = gachaState?.xpCost ?? 100;
  const pityCounter = gachaState?.pityCounter ?? 0;
  const pityThreshold = gachaState?.pityThreshold ?? 10;
  const pityPct = Math.min(100, Math.round((pityCounter / Math.max(1, pityThreshold)) * 100));
  const rollsUntilPity = Math.max(1, pityThreshold - pityCounter);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header & Balances */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pixel-pill">
            <PixelIcon name="pets" size={14} />
            Phase 3 · Pet Companions &amp; Cozy Gacha
          </span>
          <h2 className="mt-1.5 text-2xl font-bold uppercase tracking-tight text-cozy-wood">
            2.7. Pet System – Những người bạn nhỏ
          </h2>
          <p className="mt-0.5 text-xs font-medium text-cozy-muted">
            Adopt adorable Cats, Dogs, and Capybaras using earned Tickets or XP — zero real-money
            transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="cozy-card flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-cozy-wood">
            <PixelSprite spriteKey="gacha_ticket" size={22} />
            <span>Tickets:</span>
            <span className="text-sm font-bold text-[#9A5B13]">{ticketCount}</span>
          </div>
          <div className="cozy-card flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-cozy-wood">
            <PixelIcon name="sparkles" size={16} className="text-[#D48B17]" />
            <span>XP:</span>
            <span className="text-sm font-bold text-cozy-ink">{xpBalance} XP</span>
          </div>
        </div>
      </header>

      {petError && (
        <div className="border-2 border-[#3D2112] bg-[#F5B7A3] px-4 py-2.5 text-xs font-bold text-[#24140B]">
          {petError}
        </div>
      )}

      {/* Gacha Pull Celebration Result Card */}
      {lastRollResult && petBanner && (
        <section
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 border-[3px] border-[#243E1E] bg-[#DCEDBD] p-4 shadow-pixel-md"
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center border-2 ${
                SPECIES_FRAME_BG[lastRollResult.pet.species]
              }`}
            >
              <PetIllustration
                species={lastRollResult.pet.species}
                spriteKey={lastRollResult.pet.spriteKey}
                size={68}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${
                    RARITY_BADGE_CLASSES[lastRollResult.pet.rarity]
                  }`}
                >
                  {lastRollResult.pet.rarity}
                </span>
                {lastRollResult.wasDuplicate && (
                  <span className="border-2 border-[#3D2112] bg-[#F0BE63] px-2 py-0.5 text-[10px] font-bold uppercase text-[#24140B]">
                    +{lastRollResult.duplicateBonusXp} XP Rebate
                  </span>
                )}
              </div>
              <p className="mt-1 text-base font-bold text-[#24140B]">{petBanner}</p>
              <p className="text-xs text-[#3D2112]">{lastRollResult.pet.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRollResult.pet.userPetId && !lastRollResult.pet.placedGardenId && (
              <button
                type="button"
                onClick={() => {
                  void togglePetPlacement(lastRollResult.pet.userPetId!, true);
                  setActiveSection('garden');
                }}
                className="cozy-btn-primary py-2 text-xs"
              >
                <PixelIcon name="garden" size={14} />
                <span>Send to Garden</span>
              </button>
            )}
            <button
              type="button"
              onClick={clearRollBanner}
              className="border-2 border-[#3D2112] bg-white p-1.5 text-cozy-wood"
              aria-label="Dismiss roll result"
            >
              <PixelIcon name="close" size={14} />
            </button>
          </div>
        </section>
      )}

      {/* Cozy Companion Gacha Machine + Transparent Drop Rates & Pity Bar */}
      <section className="pixel-showcase-dark p-5">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-between gap-4 border-2 border-[#2B2D35] bg-[#191A1F] p-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 border border-[#4B4E59] bg-[#24262E] px-2.5 py-1 text-[10px] font-bold uppercase text-[#F5CE5E]">
                  <PixelIcon name="gift" size={12} />
                  Cozy Adoption Gacha
                </span>
                <span className="text-xs font-bold text-[#9CA3AF]">
                  Roster: Cats, Dogs &amp; Capybaras Only (0 Bears)
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-white">
                Invite a New Garden Companion
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA]">
                Duplicates automatically strengthen friendship count and grant{' '}
                <strong className="text-[#F5CE5E]">+25 XP rebate</strong>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isRolling || ticketCount < ticketCost}
                onClick={() => void rollGacha('ticket')}
                className="cozy-btn-primary flex-1 py-2.5 text-xs"
              >
                <PixelIcon name="gift" size={14} />
                <span>
                  {isRolling ? 'Summoning...' : `Roll x1 Ticket (Have ${ticketCount})`}
                </span>
              </button>

              <button
                type="button"
                disabled={isRolling || xpBalance < xpCost}
                onClick={() => void rollGacha('xp')}
                className="cozy-btn-secondary flex-1 py-2.5 text-xs"
              >
                <PixelIcon name="sparkles" size={14} className="text-[#B87212]" />
                <span>
                  {isRolling ? 'Summoning...' : `Roll ${xpCost} XP`}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-2 border-[#2B2D35] bg-[#191A1F] p-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">Rare+ Guarantee Pity</span>
                <span className="text-[#F5CE5E]">
                  {pityCounter} / {pityThreshold} ({rollsUntilPity} left)
                </span>
              </div>
              <div className="mt-2 h-3.5 border-2 border-[#2E3039] bg-[#0D0E11]">
                <div
                  style={{ width: `${pityPct}%` }}
                  className="h-full bg-[#F5CE5E] transition-all"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                Guaranteed Rare, Epic, or Legendary companion within every {pityThreshold} pulls.
              </p>
            </div>

            <div className="border-t-2 border-[#2A2C34] pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Transparent Drop Rates
              </p>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
                <div className="border border-[#4B5563] bg-[#24262E] py-1 text-[#E5E7EB]">
                  Common {gachaState?.rates.common ?? 65}%
                </div>
                <div className="border border-[#2563EB] bg-[#172554] py-1 text-[#BFDBFE]">
                  Rare {gachaState?.rates.rare ?? 25}%
                </div>
                <div className="border border-[#9333EA] bg-[#3B0764] py-1 text-[#E9D5FF]">
                  Epic {gachaState?.rates.epic ?? 8}%
                </div>
                <div className="border border-[#CA8A04] bg-[#422006] py-1 text-[#FEF08A]">
                  Leg. {gachaState?.rates.legendary ?? 2}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Row & Collection Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SPECIES_FILTERS.map((f) => {
            const active = speciesFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSpeciesFilter(f.id)}
                className={active ? 'cozy-btn-primary py-1.5' : 'cozy-btn-secondary py-1.5'}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-cozy-wood">
          <span className="border-2 border-[#3D2112] bg-[#FAF0DC] px-3 py-1 shadow-pixel-sm">
            Owned: {ownedCount} / {catalog.length}
          </span>
          <span className="border-2 border-[#3D2112] bg-[#DCEDBD] px-3 py-1 text-[#243E1E] shadow-pixel-sm">
            In Garden: {placedCount}
          </span>
        </div>
      </div>

      {/* Reference Image 2 Dark Showcase Pet Album Grid */}
      <section className="pixel-showcase-dark p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((pet) => {
            const frameBg = SPECIES_FRAME_BG[pet.species];
            const isPlaced = pet.placedGardenId !== null;
            const isEditing = editingPetId === pet.petDefinitionId;

            return (
              <div
                key={pet.petDefinitionId}
                className={`flex flex-col justify-between border-2 bg-[#191A1F] p-3.5 ${
                  pet.isOwned ? 'border-[#5E9A4E]' : 'border-[#2B2D35] opacity-90'
                }`}
              >
                <div>
                  <div
                    className={`relative flex h-52 w-full items-center justify-center border-2 ${frameBg}`}
                  >
                    <div className={pet.isOwned ? '' : 'opacity-60 grayscale-[55%]'}>
                      <PetIllustration
                        species={pet.species}
                        spriteKey={pet.spriteKey}
                        size={148}
                      />
                    </div>

                    <span
                      className={`absolute left-2 top-2 border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${
                        RARITY_BADGE_CLASSES[pet.rarity]
                      }`}
                    >
                      {pet.rarity}
                    </span>

                    {!pet.isOwned ? (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 border border-[#2B160B] bg-[#141416]/85 px-2 py-0.5 text-[10px] font-bold uppercase text-[#D1D5DB]">
                        <PixelIcon name="lock" size={10} />
                        Locked
                      </span>
                    ) : (
                      isPlaced && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 border border-[#243E1E] bg-[#649E4F] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          <PixelIcon name="heart" size={10} />
                          In Garden
                        </span>
                      )
                    )}

                    {pet.isOwned && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 border border-[#1E1F24] bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
                        <PixelIcon name="pets" size={12} />x{pet.duplicateCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {pet.nickname ? `${pet.nickname} (${pet.name.split(' ')[0]})` : pet.name}
                      </h4>
                      <span className="text-[10px] font-bold uppercase text-[#F5CE5E]">
                        {pet.species}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">{pet.description}</p>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2 border-t-2 border-[#272930] pt-3">
                  {pet.isOwned && pet.userPetId ? (
                    <>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void updatePetNickname(pet.userPetId!, nicknameDraft);
                            setEditingPetId(null);
                          }}
                          className="flex gap-1.5"
                        >
                          <input
                            type="text"
                            maxLength={24}
                            placeholder="Pet nickname..."
                            value={nicknameDraft}
                            onChange={(e) => setNicknameDraft(e.target.value)}
                            className="flex-1 border-2 border-[#3E414C] bg-[#0F1014] px-2 py-1 text-xs font-bold text-white outline-none focus:border-[#73BD59]"
                          />
                          <button type="submit" className="cozy-btn-primary px-2.5 py-1 text-xs">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPetId(null)}
                            className="cozy-btn-secondary px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void togglePetPlacement(pet.userPetId!, !isPlaced)}
                            className={
                              isPlaced
                                ? 'cozy-btn-secondary flex-1 py-1.5 text-xs'
                                : 'cozy-btn-primary flex-1 py-1.5 text-xs'
                            }
                          >
                            <PixelIcon name="garden" size={14} />
                            <span>{isPlaced ? 'Recall from Garden' : 'Place in Garden'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPetId(pet.petDefinitionId);
                              setNicknameDraft(pet.nickname ?? '');
                            }}
                            title="Give pet a custom nickname"
                            className="border-2 border-[#3E414C] bg-[#24262E] p-1.5 text-[#E5E7EB] hover:border-[#F5CE5E]"
                          >
                            <PixelIcon name="pencil" size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-[11px] font-bold uppercase text-[#71717A]">
                      Pull in Companion Gacha to Unlock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Roll Ledger */}
      {(gachaState?.recentHistory.length ?? 0) > 0 && (
        <section className="cozy-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <PixelIcon name="statistics" size={16} className="text-cozy-sage-dark" />
            <h3 className="text-sm font-bold uppercase text-cozy-wood">
              Recent Gacha Adoption History
            </h3>
          </div>
          <div className="space-y-1.5">
            {gachaState!.recentHistory.slice(0, 6).map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#3D2112]/40 bg-[#FFF8E8] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      RARITY_BADGE_CLASSES[h.rarity]
                    }`}
                  >
                    {h.rarity}
                  </span>
                  <span className="font-bold text-cozy-wood">{h.petName}</span>
                  {h.wasDuplicate && (
                    <span className="text-[11px] font-bold text-[#B87212]">
                      (Duplicate +25 XP)
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-cozy-muted">
                  Spent {h.currencySpent} {h.currencyType === 'ticket' ? 'Ticket' : 'XP'} · Pity:{' '}
                  {h.pityCounterAfter}/{pityThreshold}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

