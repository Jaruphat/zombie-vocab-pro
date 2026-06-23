import React, { useEffect, useMemo, useState } from 'react';
import { GameButton } from '../ui/GameButton';
import { useRankingStore } from '../../stores/rankingStore';
import { useTranslation } from '../../hooks/useTranslation';
import { PlayerBadge } from './PlayerBadge';
import { resizeAvatarFile } from '../../utils/playerAvatar';
import type { PlayerProfile } from '../../types';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPlayedAt = (playedAt: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(playedAt));

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const rankingStore = useRankingStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'players' | 'ranking'>('players');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftAvatarDataUrl, setDraftAvatarDataUrl] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState('');
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  const activeProfile = rankingStore.getActiveProfile();
  const canDeleteProfiles = rankingStore.profiles.length > 1;
  const topEntries = useMemo(() => rankingStore.leaderboard.slice(0, 20), [rankingStore.leaderboard]);

  useEffect(() => {
    if (!isOpen) return;
    setEditingProfileId(activeProfile.id);
    setDraftName(activeProfile.name);
    setDraftAvatarDataUrl(activeProfile.avatarDataUrl);
    setAvatarError('');
  }, [activeProfile.avatarDataUrl, activeProfile.id, activeProfile.name, isOpen]);

  if (!isOpen) return null;

  const resetEditor = (profile?: PlayerProfile) => {
    const nextProfile = profile ?? rankingStore.getActiveProfile();
    setEditingProfileId(nextProfile.id);
    setDraftName(nextProfile.name);
    setDraftAvatarDataUrl(nextProfile.avatarDataUrl);
    setAvatarError('');
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAvatarLoading(true);
    setAvatarError('');
    try {
      const avatarDataUrl = await resizeAvatarFile(file);
      setDraftAvatarDataUrl(avatarDataUrl);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Unable to use this image.');
    } finally {
      setIsAvatarLoading(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = () => {
    const safeName = draftName.trim();
    if (!safeName) return;

    if (editingProfileId && rankingStore.profiles.some((profile) => profile.id === editingProfileId)) {
      rankingStore.updateProfile(editingProfileId, {
        name: safeName,
        avatarDataUrl: draftAvatarDataUrl,
      });
      rankingStore.setActiveProfile(editingProfileId);
      resetEditor(
        rankingStore.profiles.find((profile) => profile.id === editingProfileId) ?? activeProfile,
      );
      return;
    }

    const nextProfileId = rankingStore.addProfile({
      name: safeName,
      avatarDataUrl: draftAvatarDataUrl,
    });
    const nextProfile = rankingStore.profiles.find((profile) => profile.id === nextProfileId);
    resetEditor(nextProfile);
  };

  const handleDeleteProfile = (profile: PlayerProfile) => {
    if (!canDeleteProfiles) {
      window.alert(t('cannotDeleteLastProfile'));
      return;
    }

    if (!window.confirm(t('deleteProfileConfirm'))) return;
    rankingStore.removeProfile(profile.id);
    resetEditor();
  };

  const handleClearRanking = () => {
    if (!window.confirm(t('clearRankingConfirm'))) return;
    rankingStore.clearLeaderboard();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-[#d9c5a6]/55 bg-gradient-to-b from-[#fffaf1] via-[#f3e8d3] to-[#e6d6bc] shadow-[0_30px_60px_rgba(0,0,0,0.58)] sm:max-w-5xl">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_8%,rgba(255,255,255,0.38),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(255,255,255,0.2),transparent_38%)]" />

        <div className="relative border-b border-[#e8dbc5]/45 p-4 text-[#4a3a28] sm:p-5">
          <div className="pointer-events-none absolute inset-x-3 top-2 h-2 rounded-full bg-gradient-to-r from-[#f5e8cd]/80 via-[#e8d6b6]/70 to-[#d7c09a]/70" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide sm:text-2xl">{t('playerRanking')}</h2>
              <p className="text-xs text-[#6b5843] sm:text-sm">{t('webappRankingNote')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#e8dbc5]/45 bg-[#d4be98] shadow-md transition hover:brightness-110"
              aria-label="Close ranking modal"
            >
              <img
                src="/assets/ui/jungle/btn/close.png"
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
            </button>
          </div>
        </div>

        <div className="border-b border-[#e8dbc5]/45 bg-[#d4be98]/45 px-3 pt-2 sm:px-4">
          <div className="flex">
            {[
              { id: 'players', label: t('playerProfiles') },
              { id: 'ranking', label: t('rankingBoard') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'players' | 'ranking')}
                className={`rounded-t-xl px-4 py-2 text-sm font-black uppercase tracking-wide transition-all sm:px-6 sm:py-3 ${
                  activeTab === tab.id
                    ? 'border border-b-0 border-[#e8dbc5] bg-[#fffcf7] text-[#4a3a28] shadow-[0_-4px_10px_rgba(0,0,0,0.15)]'
                    : 'border border-transparent text-[#6b5843] hover:bg-[#d8c7aa]/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="game-scroll relative min-h-0 flex-1 overflow-y-auto bg-[#fffcf7]/96 p-3 text-[#4a3a28] sm:p-6">
          {activeTab === 'players' ? (
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4 rounded-2xl border border-[#eadfcb] bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#7a654b]">{t('currentPlayer')}</p>
                    <h3 className="text-lg font-black">{activeProfile.name}</h3>
                  </div>
                  <PlayerBadge
                    name={activeProfile.name}
                    avatarDataUrl={activeProfile.avatarDataUrl}
                    subtitle={t('activePlayer')}
                  />
                </div>

                <div className="rounded-2xl border border-[#efe5d3] bg-[#f8efe1] p-4">
                  <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-[#4a3a28]">
                    {editingProfileId ? t('editProfileLabel') : t('createProfile')}
                  </h4>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-[#7a654b]">
                          {t('playerName')}
                        </label>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          placeholder={t('playerNamePlaceholder')}
                          className="w-full rounded-xl border border-[#dcc9a9] bg-white px-3 py-2 font-semibold text-[#4a3a28] outline-none transition focus:border-[#c9781f]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wide text-[#7a654b]">
                          {t('avatar')}
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <PlayerBadge
                            name={draftName.trim() || t('playerNamePlaceholder')}
                            avatarDataUrl={draftAvatarDataUrl}
                            compact={true}
                          />
                          <label className="inline-flex cursor-pointer items-center rounded-xl border border-[#dcc9a9] bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-[#5d4b38] transition hover:bg-[#f6ebdb]">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                            {isAvatarLoading ? t('uploadingAvatar') : t('uploadPhoto')}
                          </label>
                          {draftAvatarDataUrl && (
                            <button
                              type="button"
                              onClick={() => setDraftAvatarDataUrl(undefined)}
                              className="rounded-xl border border-[#dcc9a9] bg-[#f7e1d8] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#8a4a3a] transition hover:bg-[#f2d2c5]"
                            >
                              {t('removePhoto')}
                            </button>
                          )}
                        </div>
                        {avatarError && <p className="text-xs font-semibold text-[#b64532]">{avatarError}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col justify-end gap-2">
                      <GameButton variant="primary" size="md" onClick={handleSaveProfile} className="min-w-[150px]">
                        {t('saveProfile')}
                      </GameButton>
                      <GameButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingProfileId(null);
                          setDraftName('');
                          setDraftAvatarDataUrl(undefined);
                          setAvatarError('');
                        }}
                      >
                        {t('newProfile')}
                      </GameButton>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-[#eadfcb] bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#7a654b]">{t('playerProfiles')}</p>
                    <h3 className="text-lg font-black">{rankingStore.profiles.length} {t('savedPlayers')}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {rankingStore.profiles.map((profile) => {
                    const isActive = profile.id === activeProfile.id;
                    return (
                      <div
                        key={profile.id}
                        className={`rounded-2xl border p-3 ${
                          isActive ? 'border-[#9dcf79] bg-[#fff8e8]' : 'border-[#e4d4bb] bg-[#fdfbf6]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <PlayerBadge
                            name={profile.name}
                            avatarDataUrl={profile.avatarDataUrl}
                            subtitle={isActive ? t('activePlayer') : t('savedPlayer')}
                            compact={true}
                            className="flex-1"
                          />
                          <div className="flex flex-wrap gap-2">
                            <GameButton
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                rankingStore.setActiveProfile(profile.id);
                                resetEditor(profile);
                              }}
                            >
                              {isActive ? t('selectedPlayer') : t('useThisPlayer')}
                            </GameButton>
                            <GameButton
                              variant="tertiary"
                              size="sm"
                              onClick={() => resetEditor(profile)}
                            >
                              {t('edit')}
                            </GameButton>
                            <GameButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteProfile(profile)}
                              disabled={!canDeleteProfiles}
                            >
                              {t('delete')}
                            </GameButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfcb] bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#7a654b]">{t('rankingBoard')}</p>
                  <h3 className="text-lg font-black">{t('topSurvivors')}</h3>
                  <p className="text-xs font-semibold text-[#7a654b]">{t('webappRankingNote')}</p>
                </div>
                <GameButton variant="danger" size="sm" onClick={handleClearRanking}>
                  {t('clearRanking')}
                </GameButton>
              </div>

              {topEntries.length > 0 ? (
                <div className="space-y-3">
                  {topEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[#e4d4bb] bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9c5a6] bg-[#f8efe1] text-sm font-black text-[#7b5f3d]">
                            #{index + 1}
                          </div>
                          <PlayerBadge
                            name={entry.playerName}
                            avatarDataUrl={entry.playerAvatarDataUrl}
                            subtitle={`${t('level')} ${entry.level}`}
                            compact={true}
                            className="min-w-0 flex-1"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-[#4a3a28]">{entry.score.toLocaleString()}</p>
                          <p className="text-xs font-semibold text-[#7a654b]">{t('score')}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#7a654b]">
                        <span className="rounded-full border border-[#e2d5bf] bg-[#f8efe1] px-2.5 py-1">
                          {t('playedOn')}: {formatPlayedAt(entry.playedAt)}
                        </span>
                        {entry.wordSetNames.slice(0, 2).map((name) => (
                          <span
                            key={`${entry.id}-${name}`}
                            className="rounded-full border border-[#e2d5bf] bg-white px-2.5 py-1"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d9c5a6] bg-white/80 p-8 text-center text-[#7a654b]">
                  <p className="text-lg font-black">{t('noScoresYet')}</p>
                  <p className="mt-2 text-sm font-semibold">{t('playToCreateRanking')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#e8dbc5]/45 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex justify-end">
            <GameButton variant="primary" size="md" onClick={onClose}>
              {t('done')}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};
