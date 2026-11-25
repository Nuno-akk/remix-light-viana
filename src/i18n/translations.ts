import type {
  ColorFxPattern,
  FixtureType,
  MidiTargetId,
  MidiTriggerMode,
  MoveFxPattern,
} from '../types/dmx.ts';

export type AppLanguage = 'en' | 'pt-PT';

export const LANGUAGE_LABELS: Record<AppLanguage, {native: string; subtitle: string}> = {
  en: {native: 'English', subtitle: 'English (International)'},
  'pt-PT': {native: 'Português (Portugal)', subtitle: 'Português Europeu'},
};

export interface TranslationCatalog {
  appTitle: string;
  // TopBar
  navAriaLabel: string;
  navLive: string;
  navBank: string;
  navFixtures: string;
  navEdit: string;
  navAudio: string;
  navNetwork: string;
  settingsButton: string;
  savePresetButton: string;

  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  settingsLanguageLabel: string;
  settingsLanguageHint: string;
  settingsInterfaceLabel: string;
  settingsTabletModeLabel: string;
  settingsTabletModeHint: string;
  settingsOn: string;
  settingsOff: string;
  settingsDone: string;
  settingsOfflineLabel: string;
  settingsOfflineHint: string;
  settingsOfflineReady: string;
  settingsOfflineSyncing: string;
  settingsOfflineConnOnline: string;
  settingsOfflineConnOffline: string;
  settingsBackupLabel: string;
  settingsBackupHint: string;
  settingsDownloadBackup: string;
  settingsUploadBackup: string;
  settingsBackupDownloaded: (presetsCount: number, banksCount: number, fixturesCount: number) => string;
  settingsBackupRestored: string;
  settingsBackupInvalid: string;
  settingsResetLabel: string;
  settingsResetHint: string;
  settingsResetBtn: string;
  settingsResetConfirmPrompt: string;
  settingsResetConfirmBtn: string;
  settingsResetCancelBtn: string;
  settingsResetSuccess: string;
  settingsAdminLabel: string;
  settingsAdminHint: string;
  settingsAdminUsernameLabel: string;
  settingsAdminPasswordLabel: string;
  settingsAdminUnlockBtn: string;
  settingsAdminLockBtn: string;
  settingsAdminUnlockedBadge: (username: string) => string;
  settingsAdminInvalid: string;
  settingsAdminServerOffline: string;
  settingsAdminDownloadWindows: string;
  settingsAdminDownloadAndroid: string;
  settingsAdminPackageHint: string;
  settingsAdminDownloaded: (pkgName: string) => string;
  settingsAdminDownloadError: string;
  settingsAdminChangeCredsBtn: string;
  settingsAdminChangeCredsTitle: string;
  settingsAdminCurrentPasswordLabel: string;
  settingsAdminNewUsernameLabel: string;
  settingsAdminNewPasswordLabel: string;
  settingsAdminConfirmPasswordLabel: string;
  settingsAdminSaveCredsBtn: string;
  settingsAdminCancelCredsBtn: string;
  settingsAdminCredsUpdated: (username: string) => string;
  settingsAdminPasswordMismatch: string;
  settingsAdminPasswordTooShort: string;
  settingsAdminUsernameInvalid: string;
  settingsAdminCurrentPasswordInvalid: string;
  settingsAdminCredsUpdateError: string;

  // Live Console header strip
  readoutMaster: string;
  readoutBeams: string;
  readoutWash: string;
  readoutFx: string;
  readoutSmoke: string;
  layoutFxDeck: string;
  layoutSplit: string;
  layoutFaderWing: string;

  // Audio error
  audioMicError: string;

  // StageVisualizer
  stageAriaLabel: string;
  stageLiveTitle: string;
  stageFixturesCount: (count: number) => string;
  stageFrozen: string;
  stageBlackout: string;
  stageChannelPrefix: string;
  stageEditFixture: string;
  stageClose: string;

  // Move FX
  moveFxAriaLabel: string;
  moveFxTitle: string;
  moveFxSubtitle: string;
  statusActive: string;
  statusOff: string;
  sliderSpeed: string;
  sliderSize: string;
  sliderFan: string;
  movePatterns: Record<MoveFxPattern, string>;

  // Color FX
  colorFxAriaLabel: string;
  colorFxTitle: string;
  colorFxSubtitle: string;
  livePalette: string;
  slotPrimary: string;
  slotSecondary: string;
  slotAccent: string;
  selectColorSlotAria: (slotName: string) => string;
  swatchLabel: (slotName: string) => string;
  customColor: string;
  setColorAria: (hex: string) => string;
  sliderFadeSmooth: string;
  sliderPhaseShift: string;
  colorPatterns: Record<ColorFxPattern, string>;

  // Flash FX Center
  flashCenterAriaLabel: string;
  tempoSync: string;
  increaseBpm: string;
  decreaseBpm: string;
  masterDimmerLabel: string;
  audioPulse: string;
  audioModeOff: string;
  audioModeSynth: string;
  audioModeMic: string;
  flashFxTitle: string;
  modeHold: string;
  modeLatch: string;
  flashSmoke: string;
  flashBlinder: string;
  flashStrobe: string;
  freezeActive: string;
  freezeIdle: string;
  blackoutActive: string;
  blackoutIdle: string;
  strobeRate: string;
  panTiltCenter: string;
  centerAction: string;
  panTiltPadAria: string;
  beamFxTitle: string;
  zoomLabel: string;
  goboSpin: string;
  prism3x: string;
  irisPulse: string;
  uvLight: string;

  // Console Fader
  faderTooltip: string;

  // Fader Wing Panel
  stripTitle: string;
  stripSubtitle: string;
  stripEquipBtn: string;
  resetDimmers: string;
  fixturesAndColorsArrow: string;
  faderMaster: string;
  faderMasterSub: string;
  faderBeams: string;
  faderGroupSub: string;
  faderWash: string;
  faderParBarSub: string;
  faderBlinders: string;
  faderFxGrpSub: string;
  faderSmoke: string;
  faderHazeSub: string;
  faderMoveSpd: string;
  faderMoveSize: string;
  faderColorSpd: string;
  faderColorFade: string;
  faderEquipBtn: string;
  faderBeamZoom: string;
  faderOpticSub: string;
  faderStrobe: string;
  faderStrobeHzLabel: string;
  faderShiftColor: string;
  faderSpreadSub: string;
  faderFanMove: string;
  faderPhaseSub: string;
  faderSmoothSub: string;
  faderGlobalSub: string;
  faderMovingSub: string;
  faderHazeOutSub: string;
  faderFlashFxSub: string;
  equipDrawerTitle: string;
  equipDrawerSubtitle: string;
  autoColorFx: string;
  resetAllColors: (count: number) => string;
  closeBtn: string;
  setHexOnFixtureAria: (hex: string, name: string) => string;
  customColorForAria: (name: string) => string;
  dimmerFixtureLabel: (name: string) => string;
  wingTitle: string;
  wingSubtitle: string;
  wingTabGroups: string;
  wingTabFixtures: (count: number) => string;
  wingTabChannels: string;
  wingTabDmx512: string;
  wingTabUniverse: string;
  universeTitle: string;
  universeSubtitle: string;
  universeFormatBoth: string;
  universeFormatDec: string;
  universeFormatHex: string;
  universeFilterAll: string;
  universeFilterActive: string;
  universeFilterPatched: string;
  universeFilterOverridden: string;
  universeSearchPlaceholder: string;
  universePauseBtn: string;
  universeResumeBtn: string;
  universeStatsLine: (active: number, patched: number, overrides: number) => string;
  universeEmptyFiltered: string;
  universeResetFilters: string;
  universeUnpatchedLabel: string;
  universeOverriddenTag: string;
  universeInspectorChannel: (ch: number) => string;
  universeInspectorRelease: string;
  universeInspectorSetZero: string;
  universeInspectorSetFull: string;
  universeLabelPlaceholder: string;
  universeCustomLabelAria: (ch: number) => string;
  universeInspectorLabelAria: (ch: number) => string;
  universeClearLabelAria: (ch: number) => string;
  universeShiftClickHint: string;
  universeBulkSelectedSummary: (count: number, minCh: number, maxCh: number) => string;
  universeBulkLabelPlaceholder: string;
  universeBulkLabelAria: string;
  universeBulkApplyBtn: string;
  universeBulkClearLabelsBtn: (count: number) => string;
  universeBulkDeselectBtn: string;
  wingGroupsHeader: string;
  wingColorPerFixArrow: string;
  allGroups100: string;
  zeroGroups: string;
  fixtureColorFadeDimmerTitle: (name: string) => string;
  fixedColorBadge: (hex: string) => string;
  followingGlobalColorFx: string;
  returnToColorFx: string;
  clearColorsCount: (count: number) => string;
  allDimmers100: string;
  unmuteAll: string;
  quickPaletteFor: (name: string) => string;
  fixturePaletteTip: string;
  faderRed: string;
  faderGreen: string;
  faderBlue: string;
  btnFixedColor: string;
  btnColorEdit: string;
  btnMute: string;
  btnFlash: string;
  releaseFixture: (count: number) => string;
  btnRelease: string;
  btnAutoFx: string;
  noFixturesPatched: string;
  dmxUpperBanksAria: string;
  releaseAllCount: (count: number) => string;
  btnRelShort: string;
  btnLive: string;

  // Presets Dock & Save Modal
  presetsAriaLabel: string;
  presetsTitle: string;
  presetsCount: (count: number) => string;
  saveCurrentPreset: string;
  deletePresetAria: (name: string) => string;
  saveModalTitle: string;
  closeModalAria: string;
  presetNameLabel: string;
  presetNamePlaceholder: string;
  cancelBtn: string;
  savePresetBtn: string;

  // Bank View & Undo/Redo
  bankManagerTitle: string;
  bankManagerSubtitle: string;
  undoBtn: string;
  redoBtn: string;
  undoTooltip: (label: string) => string;
  undoNothingTooltip: string;
  redoTooltip: (label: string) => string;
  redoNothingTooltip: string;
  historyTooltip: string;
  autoCycleLabel: string;
  autoCycleManual: string;
  autoCycleBeats: (beats: number) => string;
  newBankBtn: string;
  historyShortcutHint: string;
  closeHistoryBtn: string;
  historyEmpty: string;
  historyBeforePrefix: (label: string) => string;
  newBankPlaceholder: string;
  selectBankColorAria: (hex: string) => string;
  createBankBtn: string;
  deleteBankTitle: string;
  deleteBankBtn: string;
  newScenePlaceholder: (bankName: string) => string;
  sceneTagLabel: string;
  sceneTagColorAria: (hex: string) => string;
  createSceneBtn: string;
  bankEmptyTextBefore: string;
  bankEmptyTextStrong: string;
  editSceneSave: string;
  sceneCustomColors: (count: number) => string;
  sceneActive: string;
  sceneTrigger: string;
  sceneOverwriteTitle: string;
  sceneOverwriteBtn: string;
  sceneEditTitle: string;
  sceneDuplicateTitle: string;
  sceneDeleteTitle: string;
  bankDeckTitle: string;
  hideFadersBtn: string;
  showFadersBtn: string;
  minimizeFxDeckBtn: string;
  expandFxDeckBtn: string;
  undoFeedbackUndone: (label: string) => string;
  undoFeedbackRedone: (label: string) => string;
  undoFeedbackRestored: (label: string) => string;
  chkTriggerScene: (name: string) => string;
  chkCreateBank: (name: string) => string;
  chkDeleteBank: (name: string) => string;
  chkCreateScene: (name: string) => string;
  chkSaveScene: (name: string) => string;
  chkEditScene: (name: string) => string;
  chkDuplicateScene: (name: string) => string;
  sceneCopySuffix: string;
  chkDeleteScene: (name: string) => string;
  chkAdjustMoveFx: string;
  chkAdjustColorFx: string;
  chkAdjustFlashFx: string;
  chkAdjustBeamFx: string;
  chkTapBpm: string;
  chkAdjustBpm: string;
  chkAdjustMasterDimmer: string;
  chkAdjustGroupDimmers: string;
  chkAdjustFixtureDimmer: string;
  chkResetFixtureDimmers: string;
  chkToggleFixtureMute: string;
  chkUnmuteAllFixtures: string;
  chkChangeFixtureColor: string;
  chkClearFixtureColors: string;
  chkAdjustDmxChannel: (ch: number) => string;
  chkClearManualDmx: string;

  // Fixtures & DMX View
  dmxMatrixTitle: string;
  dmxMatrixSubtitle: string;
  dmxFreeChannel: string;
  dmxHoverHint: string;
  patchedFixturesTitle: string;
  totalLabel: string;
  searchFixturesPlaceholder: string;
  filterAll: string;
  filterBeams: string;
  filterWash: string;
  filterFx: string;
  resetRigBtn: string;
  noFixtureMatch: string;
  clearFiltersBtn: string;
  colFixture: string;
  colDmxAddr: string;
  colChannels: string;
  colInvert: string;
  colAction: string;
  hideChannelMap: string;
  showChannelMap: string;
  fixtureLibraryTitle: string;
  onlineSearchTab: string;
  uploadFileTab: string;
  dropProfileHint: string;
  selectProfileFileBtn: string;
  samplesLabel: string;
  discardProfileAria: string;
  dmxModeLabel: string;
  stageBehaviorLabel: string;
  qtyLabel: string;
  channelCountLabel: string;
  patchImportedBtn: (qty: number, addr: string) => string;
  quickAddTitle: string;
  quickAddSubtitle: string;
  fixtureProfileLabel: string;
  customNameLabel: string;
  customNamePlaceholder: string;
  nextFreeDmxLabel: string;
  patchToUniverseBtn: string;
  importUnsupportedErr: string;
  importReadErr: string;
  importInsufficientChErr: (needed: number, addr: number) => string;
  importPatchedNotice: (qty: number, name: string, ch: number, addr: string) => string;
  fixtureTypeLabels: Record<FixtureType, string>;

  // Online Fixture Search
  oflTitle: string;
  oflSearchPlaceholder: string;
  oflAllManufacturers: string;
  oflRetry: string;
  oflEmpty: string;
  oflLoad: string;
  oflSearchError: string;
  oflDownloadError: string;
  oflOfflineNotice: string;
  oflOfflineTag: string;

  // RDM Autodiscovery
  rdmTitle: string;
  rdmSubtitle: string;
  rdmArtNetIp: string;
  rdmUni: string;
  rdmForceFlush: string;
  rdmScanning: string;
  rdmDiscoverBtn: string;
  rdmScanUsbBtn: string;
  rdmNodesLabel: string;
  rdmRespondersLabel: string;
  rdmReadyHint: string;
  rdmHideLog: string;
  rdmViewLog: (count: number) => string;
  rdmLogEmpty: string;
  rdmActive: string;
  rdmUnsupported: string;
  rdmEmptyResponded: string;
  rdmEmptyIdle: string;
  rdmEmptyHintBefore: string;
  rdmEmptyHintAfter: string;
  rdmAutoResolve: string;
  rdmImportNew: (count: number) => string;
  rdmImportAll: (count: number) => string;
  rdmColUid: string;
  rdmColFixtureMfg: string;
  rdmColCategory: string;
  rdmColFootprint: string;
  rdmColDmxAddr: string;
  rdmColActions: string;
  rdmConflictTitle: string;
  rdmIdentifying: string;
  rdmIdentify: string;
  rdmPatched: string;
  rdmPatch: string;
  rdmNoticeSetAddr: (addr: string, uid: string) => string;
  rdmNoticeAdded: (name: string, uid: string, addr: string) => string;
  rdmNoticePatchedMulti: (count: number) => string;
  rdmSerialUnsupportedErr: string;
  rdmSerialCancelErr: string;
  rdmServerRequiredNotice: string;

  // Live Edit View
  liveEditNoFixtures: string;
  selectFixtureTitle: string;
  manualControlCount: (count: number) => string;
  allFollowingFx: string;
  releaseAllBtn: string;
  liveEditTitleSuffix: string;
  liveEditSubtitle: string;
  manualControlActive: string;
  enableManualControl: string;
  manualPanTiltLabel: string;
  fixtureDimmerLabel: string;
  fixtureColorLabel: string;
  liveEditTip: string;

  // Audio Sync View
  audioEngineTitle: string;
  audioEngineSubtitle: string;
  clockOnly: string;
  testBeatSynth: string;
  liveMic: string;
  beatSensitivity: string;
  hwBackupTitle: string;
  hwBackupSubtitle: string;
  usbDmxOutput: string;
  connectDmxBtn: string;
  dmxDisconnected: string;
  dmxUnsupported: string;
  dmxConnected: string;
  dmxCancelled: string;
  midiInputTitle: string;
  scanMidiBtn: string;
  midiUnsupported: string;
  midiDenied: string;
  midiNotScanned: string;
  midiReadySummary: (devices: number, bindings: number) => string;
  midiNoHwSummary: (bindings: number) => string;
  exportShowBtn: string;
  importShowBtn: string;

  // MIDI Mapping Panel & Targets
  midiTitle: string;
  midiSubtitle: string;
  midiFilterDeviceAria: string;
  midiAllInputs: (count: number) => string;
  midiDisconnectedTag: string;
  midiStandardMap: string;
  midiClearAll: string;
  midiStatusUnsupported: string;
  midiStatusDenied: string;
  midiStatusActive: (inputs: number, bindings: number) => string;
  midiStatusReady: (bindings: number) => string;
  midiStatusIdle: (bindings: number) => string;
  midiLastInput: string;
  midiMonitorHint: string;
  midiLearnActive: string;
  midiLearnPrompt: string;
  midiCancelEsc: string;
  midiTabAll: (count: number) => string;
  midiTabDimmers: string;
  midiTabTriggers: string;
  midiTabParams: string;
  midiTabAssigned: (count: number) => string;
  midiSearchPlaceholder: string;
  midiClearSearchAria: string;
  midiNoBindingsTitle: string;
  midiNoMatchTitle: string;
  midiNoBindingsHint: string;
  midiNoMatchHint: string;
  midiShowAllBtn: string;
  midiColTarget: string;
  midiColLiveState: string;
  midiColAssignment: string;
  midiColBehavior: string;
  midiColActions: string;
  midiMsgTypeLabel: string;
  midiMsgCc: string;
  midiMsgNote: string;
  midiMsgPitchBend: string;
  midiChannelLabel: string;
  midiAnyChannel: string;
  midiDoneBtn: string;
  midiUnassigned: string;
  midiInverted: string;
  midiNormal: string;
  midiListening: string;
  midiLearnBtn: string;
  midiEditTitle: string;
  midiEditBtn: string;
  midiLiveStateActive: string;
  midiLiveStateLive: string;
  midiLiveStateFrozen: string;
  midiModeLabels: Record<MidiTriggerMode, string>;
  midiTargets: Record<
    MidiTargetId,
    {label: string; categoryLabel: string; description: string}
  >;

  // Network Remote View
  wifiPairingTitle: string;
  wifiPairingSubtitle: string;
  syncConnected: string;
  syncConnecting: string;
  syncReconnecting: string;
  syncStandalone: string;
  standaloneNetworkNotice: string;
  refreshWifiAria: string;
  generatingQr: string;
  scanQrHint: string;
  tabletUrlLabel: string;
  detectingIp: string;
  copiedBtn: string;
  copyBtn: string;
  detectedLanIps: string;
  roomCodeLabel: string;
  joinBtn: string;
  deviceNameLabel: string;
  roleWindows: string;
  roleAndroid: string;
  roleWeb: string;
  tabletModeOn: string;
  tabletModeOff: string;
  connectedDevicesIn: (room: string) => string;
  onlineCount: (count: number) => string;
  waitingDevices: string;
  thisDeviceTag: string;
  artNetTitle: string;
  artNetSubtitle: string;
  artNetTransmitting: string;
  artNetDisabled: string;
  artNetIpLabel: string;
  artNetUniLabel: string;
  artNetPacketsSent: (count: number) => string;
  artNetApplyBtn: string;
  installTitle: string;
  installSubtitle: string;
  downloadBatBtn: string;
  installStep1Before: string;
  installStep1After: string;
  installStep2: string;
  installStep3Before: string;
  installStep3Strong: string;
  installStep3After: string;
  netSettingsCardTitle: string;
  netSettingsCardSubtitle: string;

  // PWA Install
  pwaInstalled: string;
  pwaInstallBtn: string;
  pwaIosBtn: string;
  pwaIosModalTitle: string;
  pwaIosStep1Before: string;
  pwaIosStep1Strong: string;
  pwaIosStep1After: string;
  pwaIosStep2Before: string;
  pwaIosStep2Strong: string;
  pwaManualHint: string;
  offlineBanner: string;

  // Channel Labels
  channelLabels: {
    movingHead: string[];
    ledPar: string[];
    blinder: string[];
    fogger: string[];
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationCatalog> = {
  en: {
    appTitle: 'LightViana DMX — Live Lighting Console',
    navAriaLabel: 'Console sections',
    navLive: 'Live Console',
    navBank: 'Bank',
    navFixtures: 'Fixtures & DMX',
    navEdit: 'Live Edit',
    navAudio: 'Audio & Sync',
    navNetwork: 'Wi-Fi & Devices',
    settingsButton: 'Settings',
    savePresetButton: 'Save Preset',

    settingsTitle: 'Settings',
    settingsSubtitle: 'Application preferences and console language',
    settingsLanguageLabel: 'Application Language',
    settingsLanguageHint: 'Switch the entire interface between English and European Portuguese.',
    settingsInterfaceLabel: 'Interface & Touch',
    settingsTabletModeLabel: 'Tablet Touch Mode',
    settingsTabletModeHint: 'Prevents accidental text selection and optimizes touch controls on tablets.',
    settingsOn: 'Active',
    settingsOff: 'Off',
    settingsDone: 'Done',
    settingsOfflineLabel: 'Offline Mode & App Installation',
    settingsOfflineHint:
      'All fixtures, presets, scenes, 3D stage visualizer, DMX calculation, audio beat sync, and custom labels run 100% locally without internet.',
    settingsOfflineReady: 'Cached locally for offline launch',
    settingsOfflineSyncing: 'Caching app shell for offline use...',
    settingsOfflineConnOnline: 'Network Connected',
    settingsOfflineConnOffline: 'No Internet (Offline Engine Active)',
    settingsBackupLabel: 'Full Backup & Restore',
    settingsBackupHint:
      'Export or restore all presets, banks, scenes, patched fixtures, MIDI mappings, and preferences.',
    settingsDownloadBackup: 'Download Backup (.json)',
    settingsUploadBackup: 'Upload Backup (.json)',
    settingsBackupDownloaded: (p, b, f) =>
      `Backup downloaded (${p} presets, ${b} banks, ${f} fixtures).`,
    settingsBackupRestored: 'Backup restored successfully. All user changes are now active.',
    settingsBackupInvalid:
      'Invalid backup file. Please select a valid LightViana JSON backup.',
    settingsResetLabel: 'Factory Reset',
    settingsResetHint:
      'Restore the application to its original factory state (erases custom presets, scenes, fixtures, and MIDI mappings).',
    settingsResetBtn: 'Factory Reset',
    settingsResetConfirmPrompt:
      'Are you sure? All custom presets, banks, scenes, fixtures, and MIDI mappings will be permanently erased.',
    settingsResetConfirmBtn: 'Confirm Factory Reset',
    settingsResetCancelBtn: 'Cancel',
    settingsResetSuccess: 'Application restored to original factory defaults.',
    settingsAdminLabel: 'Administrator Mode — Full App Downloads',
    settingsAdminHint:
      'Sign in with administrator credentials to download complete offline/host builds for Windows and Android.',
    settingsAdminUsernameLabel: 'Administrator Username',
    settingsAdminPasswordLabel: 'Password',
    settingsAdminUnlockBtn: 'Unlock Administrator Mode',
    settingsAdminLockBtn: 'Lock',
    settingsAdminUnlockedBadge: (user) => `Unlocked (${user})`,
    settingsAdminInvalid: 'Invalid administrator username or password.',
    settingsAdminServerOffline:
      'Administrator package downloads require the LightViana server (run via Start-LightViana-Windows.bat or web URL).',
    settingsAdminDownloadWindows: 'Download Windows App (.zip)',
    settingsAdminDownloadAndroid: 'Download Android App (.zip)',
    settingsAdminPackageHint:
      'Windows ZIP includes standalone folder app (index.html) + Node host server. Android ZIP includes offline tablet bundle + complete Android Studio APK project.',
    settingsAdminDownloaded: (pkgName) => `Package "${pkgName}" downloaded successfully.`,
    settingsAdminDownloadError: 'Failed to generate application package.',
    settingsAdminChangeCredsBtn: 'Change Username & Password',
    settingsAdminChangeCredsTitle: 'Update Administrator Credentials',
    settingsAdminCurrentPasswordLabel: 'Current Password',
    settingsAdminNewUsernameLabel: 'New Username',
    settingsAdminNewPasswordLabel: 'New Password',
    settingsAdminConfirmPasswordLabel: 'Confirm New Password',
    settingsAdminSaveCredsBtn: 'Save Credentials',
    settingsAdminCancelCredsBtn: 'Cancel',
    settingsAdminCredsUpdated: (user) =>
      `Administrator credentials updated for "${user}".`,
    settingsAdminPasswordMismatch:
      'New password and confirmation do not match.',
    settingsAdminPasswordTooShort:
      'New password must be at least 6 characters.',
    settingsAdminUsernameInvalid:
      'Username must be between 2 and 32 characters.',
    settingsAdminCurrentPasswordInvalid: 'Current password is incorrect.',
    settingsAdminCredsUpdateError:
      'Failed to update administrator credentials.',

    readoutMaster: 'MASTER',
    readoutBeams: 'BEAMS',
    readoutWash: 'WASH',
    readoutFx: 'FX',
    readoutSmoke: 'SMOKE',
    layoutFxDeck: 'FX Deck',
    layoutSplit: 'FX + Faders',
    layoutFaderWing: 'Fader Wing',

    audioMicError:
      'Microphone permission was denied or unavailable. Use Test Beat Synth or allow microphone access.',

    stageAriaLabel: 'Live 3D Stage Visualizer',
    stageLiveTitle: 'Live Stage',
    stageFixturesCount: (c) => `${c} Fixtures`,
    stageFrozen: 'Frozen',
    stageBlackout: 'Blackout',
    stageChannelPrefix: 'CH',
    stageEditFixture: 'Edit Fixture',
    stageClose: 'Close',

    moveFxAriaLabel: 'Move FX Engine',
    moveFxTitle: 'Move FX',
    moveFxSubtitle: 'Pan & Tilt generators',
    statusActive: 'Active',
    statusOff: 'Off',
    sliderSpeed: 'Speed',
    sliderSize: 'Size',
    sliderFan: 'Fan',
    movePatterns: {
      circle: 'Circle',
      figure8: 'Figure 8',
      pan_sweep: 'Pan Sweep',
      tilt_wave: 'Tilt Wave',
      cross: 'X Cross',
      ballyhoo: 'Ballyhoo',
      diamond: 'Diamond',
      snap_home: 'Snap Home',
    },

    colorFxAriaLabel: 'Color FX Engine',
    colorFxTitle: 'Color FX',
    colorFxSubtitle: 'RGBW palette & chases',
    livePalette: 'Live Palette',
    slotPrimary: 'Primary',
    slotSecondary: 'Secondary',
    slotAccent: 'Accent',
    selectColorSlotAria: (s) => `Select ${s} color`,
    swatchLabel: (s) => `${s} Swatch`,
    customColor: 'Custom',
    setColorAria: (h) => `Set color ${h}`,
    sliderFadeSmooth: 'Fade Smooth',
    sliderPhaseShift: 'Phase Shift',
    colorPatterns: {
      rainbow: 'Rainbow',
      dual_chase: 'Dual Chase',
      pulse_fade: 'Pulse Fade',
      ember: 'Warm Ember',
      ocean: 'Ocean Drift',
      sparkle: 'Sparkle',
      split: 'L / R Split',
      static_wash: 'Static Wash',
    },

    flashCenterAriaLabel: 'Flash FX and Master Control',
    tempoSync: 'Tempo Sync',
    increaseBpm: 'Increase BPM',
    decreaseBpm: 'Decrease BPM',
    masterDimmerLabel: 'Master Dimmer',
    audioPulse: 'Audio Pulse',
    audioModeOff: 'Off',
    audioModeSynth: 'Beat Synth',
    audioModeMic: 'Mic',
    flashFxTitle: 'Flash FX',
    modeHold: 'Hold',
    modeLatch: 'Latch',
    flashSmoke: 'Smoke',
    flashBlinder: 'Blinder',
    flashStrobe: 'Strobe',
    freezeActive: 'Frozen',
    freezeIdle: 'Freeze',
    blackoutActive: 'Blackout Active',
    blackoutIdle: 'Blackout',
    strobeRate: 'Strobe Rate',
    panTiltCenter: 'Pan / Tilt Center',
    centerAction: 'Center',
    panTiltPadAria: 'Pan and Tilt Center XY Pad',
    beamFxTitle: 'Beam FX',
    zoomLabel: 'Zoom',
    goboSpin: 'Gobo Spin',
    prism3x: '3x Prism',
    irisPulse: 'Iris Pulse',
    uvLight: 'UV Light',

    faderTooltip: 'Drag vertically · Double-click to reset',

    stripTitle: 'Dimmer, Color Fade & FX Faders',
    stripSubtitle: 'Master · Groups · Speed & Fade · Per-Fixture Colors',
    stripEquipBtn: 'Fixture Color & Dimmer',
    resetDimmers: 'Reset Dimmers',
    fixturesAndColorsArrow: 'Fixtures & Colors →',
    faderMaster: 'Master',
    faderMasterSub: 'ALL',
    faderBeams: 'Beams',
    faderGroupSub: 'GROUP',
    faderWash: 'Wash',
    faderParBarSub: 'PAR/BAR',
    faderBlinders: 'Blinders',
    faderFxGrpSub: 'FX GRP',
    faderSmoke: 'Smoke',
    faderHazeSub: 'HAZE',
    faderMoveSpd: 'Move Spd',
    faderMoveSize: 'Move Size',
    faderColorSpd: 'Color Spd',
    faderColorFade: 'Color Fade',
    faderEquipBtn: 'FIXT.',
    faderBeamZoom: 'Beam Zoom',
    faderOpticSub: 'OPTIC',
    faderStrobe: 'Strobe',
    faderStrobeHzLabel: 'Strobe Hz',
    faderShiftColor: 'Color Shift',
    faderSpreadSub: 'SPREAD',
    faderFanMove: 'Move Fan',
    faderPhaseSub: 'PHASE',
    faderSmoothSub: 'SMOOTH',
    faderGlobalSub: 'GLOBAL',
    faderMovingSub: 'MOVING',
    faderHazeOutSub: 'HAZE OUT',
    faderFlashFxSub: 'FLASH FX',
    equipDrawerTitle: 'Color & Dimmer per Fixture',
    equipDrawerSubtitle: 'Select any fixture to change its color live',
    autoColorFx: 'Auto Color FX',
    resetAllColors: (c) => `Reset All Colors (${c})`,
    closeBtn: 'Close',
    setHexOnFixtureAria: (h, n) => `Set color ${h} on ${n}`,
    customColorForAria: (n) => `Custom color for ${n}`,
    dimmerFixtureLabel: (n) => `${n} Dimmer`,
    wingTitle: 'Fader Wing — Dimmers, Colors & DMX Channels',
    wingSubtitle: 'Touch faders synced live with Windows Art-Net & Android Tablet',
    wingTabGroups: 'Groups & FX',
    wingTabFixtures: (c) => `Fixtures & Color (${c})`,
    wingTabChannels: 'Fixture Channels',
    wingTabDmx512: 'DMX 512 Banks',
    wingTabUniverse: 'Universe Monitor',
    universeTitle: 'Universe 1 Live Monitor',
    universeSubtitle: 'Real-time hexadecimal and decimal output across all 512 DMX channels',
    universeFormatBoth: 'DEC + HEX',
    universeFormatDec: 'DEC',
    universeFormatHex: 'HEX',
    universeFilterAll: 'All (512)',
    universeFilterActive: 'Active (> 0)',
    universeFilterPatched: 'Patched',
    universeFilterOverridden: 'Overridden',
    universeSearchPlaceholder: 'Filter channel (1-512) or fixture...',
    universePauseBtn: 'Freeze Readout',
    universeResumeBtn: 'Live Readout',
    universeStatsLine: (active, patched, overrides) =>
      `512 ch · ${active} active · ${patched} patched · ${overrides} overrides`,
    universeEmptyFiltered: 'No DMX channels match the current filter.',
    universeResetFilters: 'Show All 512 Channels',
    universeUnpatchedLabel: 'Unpatched',
    universeOverriddenTag: 'OVR',
    universeInspectorChannel: (ch) => `DMX ${String(ch).padStart(3, '0')}`,
    universeInspectorRelease: 'Release to FX',
    universeInspectorSetZero: '000 (0x00)',
    universeInspectorSetFull: '255 (0xFF)',
    universeLabelPlaceholder: 'Add label...',
    universeCustomLabelAria: (ch) => `Custom label for DMX channel ${ch}`,
    universeInspectorLabelAria: (ch) => `Edit label for DMX channel ${ch}`,
    universeClearLabelAria: (ch) => `Clear custom label for DMX channel ${ch}`,
    universeShiftClickHint: 'Shift+Click to multi-select',
    universeBulkSelectedSummary: (count, minCh, maxCh) =>
      `${count} channels selected · CH ${String(minCh).padStart(3, '0')}–${String(maxCh).padStart(3, '0')}`,
    universeBulkLabelPlaceholder: 'Label for selected channels...',
    universeBulkLabelAria: 'Bulk label for selected DMX channels',
    universeBulkApplyBtn: 'Apply Label',
    universeBulkClearLabelsBtn: (count) =>
      count > 0 ? `Clear Labels (${count})` : 'Clear Labels',
    universeBulkDeselectBtn: 'Clear Selection',
    wingGroupsHeader: 'Master & Group Dimmers + Live FX Engine Parameters',
    wingColorPerFixArrow: 'Color & Dimmer per Fixture →',
    allGroups100: 'All Groups 100%',
    zeroGroups: 'Zero Groups',
    fixtureColorFadeDimmerTitle: (n) => `${n} — Color, Fade & Dimmer`,
    fixedColorBadge: (h) => `Fixed Color ${h}`,
    followingGlobalColorFx: 'Following global Color FX',
    returnToColorFx: 'Return to Color FX',
    clearColorsCount: (c) => `Clear Colors (${c})`,
    allDimmers100: 'All Dimmers 100%',
    unmuteAll: 'Unmute All',
    quickPaletteFor: (n) => `Quick Palette for ${n}`,
    fixturePaletteTip:
      'Tip: Click any fixture in the fader rack below to swap its color or adjust RGB / Dimmer faders individually.',
    faderRed: 'Red',
    faderGreen: 'Green',
    faderBlue: 'Blue',
    btnFixedColor: 'FIXED COLOR',
    btnColorEdit: 'COLOR / EDIT',
    btnMute: 'MUTE',
    btnFlash: 'FLASH',
    releaseFixture: (c) => `Release Fixture (${c})`,
    btnRelease: 'RELEASE',
    btnAutoFx: 'FX AUTO',
    noFixturesPatched: 'No fixtures patched.',
    dmxUpperBanksAria: 'Upper DMX 512 banks (257 to 512)',
    releaseAllCount: (c) => `Release All (${c})`,
    btnRelShort: 'REL.',
    btnLive: 'LIVE',

    presetsAriaLabel: 'Show Presets',
    presetsTitle: 'Presets',
    presetsCount: (c) => `${c} Scenes`,
    saveCurrentPreset: 'Save Current',
    deletePresetAria: (n) => `Delete preset ${n}`,
    saveModalTitle: 'Save Show Preset',
    closeModalAria: 'Close modal',
    presetNameLabel: 'Preset Name',
    presetNamePlaceholder: 'e.g. Main Stage Drop',
    cancelBtn: 'Cancel',
    savePresetBtn: 'Save Preset',

    bankManagerTitle: 'Bank — Scene Manager',
    bankManagerSubtitle:
      'Create, organize, and trigger full Scenes (FX + Dimmers + Per-Fixture Colors)',
    undoBtn: 'Undo',
    redoBtn: 'Redo',
    undoTooltip: (l) => `Undo: ${l} (Ctrl+Z)`,
    undoNothingTooltip: 'Nothing to undo (Ctrl+Z)',
    redoTooltip: (l) => `Redo: ${l} (Ctrl+Y)`,
    redoNothingTooltip: 'Nothing to redo (Ctrl+Y)',
    historyTooltip: 'View console and Scene edit history',
    autoCycleLabel: 'Auto-Cycle:',
    autoCycleManual: 'Manual',
    autoCycleBeats: (b) => `${b} Beats`,
    newBankBtn: 'New Bank',
    historyShortcutHint: 'State history for quick recovery',
    closeHistoryBtn: 'Close history',
    historyEmpty:
      'No changes recorded in this session yet. Create, save, delete, or adjust a Scene to capture previous states.',
    historyBeforePrefix: (l) => `Before: ${l}`,
    newBankPlaceholder: 'Bank Name (e.g. Bank 3 · Sunset)',
    selectBankColorAria: (h) => `Select bank color ${h}`,
    createBankBtn: 'Create Bank',
    deleteBankTitle: 'Delete selected Bank',
    deleteBankBtn: 'Delete Bank',
    newScenePlaceholder: (b) => `New Scene in ${b}...`,
    sceneTagLabel: 'Tag:',
    sceneTagColorAria: (h) => `Scene tag color ${h}`,
    createSceneBtn: 'Create Scene (Capture Current Look)',
    bankEmptyTextBefore: 'This Bank has no Scenes yet. Dial in a look below and click',
    bankEmptyTextStrong: 'Create Scene (Capture Current Look)',
    editSceneSave: 'Save',
    sceneCustomColors: (c) => `${c} colors`,
    sceneActive: 'Active',
    sceneTrigger: 'Trigger',
    sceneOverwriteTitle: 'Update Scene with current look',
    sceneOverwriteBtn: 'Save',
    sceneEditTitle: 'Edit Scene name and tag',
    sceneDuplicateTitle: 'Duplicate Scene',
    sceneDeleteTitle: 'Delete Scene',
    bankDeckTitle: 'Scene Creation Console (Move FX · Flash · Color FX · Faders)',
    hideFadersBtn: 'Hide Faders',
    showFadersBtn: 'Show Faders',
    minimizeFxDeckBtn: 'Minimize FX Deck',
    expandFxDeckBtn: 'Expand FX Deck',
    undoFeedbackUndone: (l) => `Undone: ${l}`,
    undoFeedbackRedone: (l) => `Redone: ${l}`,
    undoFeedbackRestored: (l) => `Restored state before: ${l}`,
    chkTriggerScene: (n) => `Trigger Scene «${n}»`,
    chkCreateBank: (n) => `Create Bank «${n}»`,
    chkDeleteBank: (n) => `Delete Bank «${n}»`,
    chkCreateScene: (n) => `Create Scene «${n}»`,
    chkSaveScene: (n) => `Save Scene «${n}»`,
    chkEditScene: (n) => `Edit Scene «${n}»`,
    chkDuplicateScene: (n) => `Duplicate Scene «${n}»`,
    sceneCopySuffix: '(Copy)',
    chkDeleteScene: (n) => `Delete Scene «${n}»`,
    chkAdjustMoveFx: 'Adjust Move FX',
    chkAdjustColorFx: 'Adjust Color FX',
    chkAdjustFlashFx: 'Adjust Flash FX',
    chkAdjustBeamFx: 'Adjust Beam FX',
    chkTapBpm: 'Tap BPM',
    chkAdjustBpm: 'Adjust BPM',
    chkAdjustMasterDimmer: 'Adjust Master Dimmer',
    chkAdjustGroupDimmers: 'Adjust Group Dimmers',
    chkAdjustFixtureDimmer: 'Adjust Fixture Dimmer',
    chkResetFixtureDimmers: 'Reset Fixture Dimmers',
    chkToggleFixtureMute: 'Toggle Fixture Mute',
    chkUnmuteAllFixtures: 'Unmute All Fixtures',
    chkChangeFixtureColor: 'Change Fixture Color',
    chkClearFixtureColors: 'Clear Fixture Colors',
    chkAdjustDmxChannel: (ch) => `Adjust DMX Channel ${ch}`,
    chkClearManualDmx: 'Clear Manual DMX Channels',

    dmxMatrixTitle: 'Live DMX Output — Universe 1',
    dmxMatrixSubtitle: 'Real-time channel value matrix 001–512',
    dmxFreeChannel: 'Free',
    dmxHoverHint: 'Hover over any channel to inspect DMX value',
    patchedFixturesTitle: 'Patched Fixtures',
    totalLabel: 'Total',
    searchFixturesPlaceholder: 'Search fixtures...',
    filterAll: 'All',
    filterBeams: 'Beams',
    filterWash: 'Wash',
    filterFx: 'FX',
    resetRigBtn: 'Reset Rig',
    noFixtureMatch: 'No fixtures match your filter.',
    clearFiltersBtn: 'Clear filters',
    colFixture: 'Fixture',
    colDmxAddr: 'DMX Addr',
    colChannels: 'Channels',
    colInvert: 'Invert',
    colAction: 'Action',
    hideChannelMap: 'Hide channel map',
    showChannelMap: 'Show channel map',
    fixtureLibraryTitle: 'Fixture Library',
    onlineSearchTab: 'Online Search',
    uploadFileTab: 'Upload File',
    dropProfileHint: 'Drop an OFL .json, DMX .csv, or .ssl2 file here',
    selectProfileFileBtn: 'Select .json / .csv / .ssl2',
    samplesLabel: 'Samples:',
    discardProfileAria: 'Discard imported profile',
    dmxModeLabel: 'DMX Mode',
    stageBehaviorLabel: 'Stage Behavior',
    qtyLabel: 'Qty',
    channelCountLabel: 'Channel Count',
    patchImportedBtn: (qty, addr) =>
      `Patch ${qty > 1 ? `${qty}x ` : ''}at CH ${addr}`,
    quickAddTitle: 'Quick Add Fixture',
    quickAddSubtitle: 'Automatically patches to next free DMX channel',
    fixtureProfileLabel: 'Fixture Profile',
    customNameLabel: 'Custom Name',
    customNamePlaceholder: 'e.g. Beam Truss #5',
    nextFreeDmxLabel: 'Next Free DMX Address',
    patchToUniverseBtn: 'Patch to Universe',
    importUnsupportedErr:
      'Unsupported format. Please upload an OFL .json, DMX .csv, or .ssl2 file.',
    importReadErr: 'Failed to parse fixture profile.',
    importInsufficientChErr: (needed, addr) =>
      `Insufficient DMX channels in Universe 1 (need ${needed}ch starting at CH ${addr}).`,
    importPatchedNotice: (qty, name, ch, addr) =>
      `Patched ${qty}x ${name} (${ch}ch) starting at CH ${addr}.`,
    fixtureTypeLabels: {
      moving_head: 'Moving Head Beam',
      led_par: 'RGBW LED Par',
      pixel_bar: 'LED Pixel Bar',
      blinder: 'Audience Blinder',
      fogger: 'Fog / Haze Machine',
    },

    oflTitle: 'Online Library (Open Fixture Library)',
    oflSearchPlaceholder: 'Search brand or model (e.g. Chauvet, ADJ, Spot)...',
    oflAllManufacturers: 'All Manufacturers',
    oflRetry: 'Retry',
    oflEmpty: 'No fixtures found for this search.',
    oflLoad: 'Load',
    oflSearchError: 'Failed to search online fixture library.',
    oflDownloadError: 'Could not download fixture profile.',
    oflOfflineNotice:
      'Offline mode: showing built-in generic DMX profiles and locally cached fixtures.',
    oflOfflineTag: 'Offline',

    rdmTitle: 'RDM Autodiscovery (ANSI E1.20 · Art-RDM)',
    rdmSubtitle:
      'Automatic discovery of RDM fixtures on the Art-Net network (UDP 6454) or via USB-DMX/RDM interface',
    rdmArtNetIp: 'Art-Net IP',
    rdmUni: 'Uni',
    rdmForceFlush: 'Force TOD Flush',
    rdmScanning: 'Scanning RDM...',
    rdmDiscoverBtn: 'Discover RDM Fixtures',
    rdmScanUsbBtn: 'Scan USB-RDM',
    rdmNodesLabel: 'Art-Net Nodes:',
    rdmRespondersLabel: 'RDM Responders:',
    rdmReadyHint:
      'RDM engine ready · Sends OpPoll + OpTodRequest + GET:DEVICE_INFO to detect UIDs automatically',
    rdmHideLog: 'Hide RDM Log',
    rdmViewLog: (c) => `View RDM Log (${c})`,
    rdmLogEmpty: 'No RDM packets sent in this session yet.',
    rdmActive: 'RDM Active',
    rdmUnsupported: 'No RDM',
    rdmEmptyResponded: 'No RDM fixtures responded to this scan.',
    rdmEmptyIdle: 'No RDM fixtures scanned in this session.',
    rdmEmptyHintBefore:
      'Connect your Art-Net/RDM node to the same Wi-Fi/Ethernet network (or pick a USB-DMX adapter with RDM support) and click',
    rdmEmptyHintAfter: 'to discover UIDs, models, and DMX channels automatically.',
    rdmAutoResolve: 'Auto-resolve DMX channel conflicts on import',
    rdmImportNew: (c) => `Import ${c} New to Patch`,
    rdmImportAll: (c) => `Import All (${c})`,
    rdmColUid: 'RDM UID',
    rdmColFixtureMfg: 'Fixture / Manufacturer',
    rdmColCategory: 'Category',
    rdmColFootprint: 'Footprint',
    rdmColDmxAddr: 'DMX Addr',
    rdmColActions: 'Actions',
    rdmConflictTitle: 'Overlaps an already patched fixture',
    rdmIdentifying: 'Identifying',
    rdmIdentify: 'Identify',
    rdmPatched: 'Patched',
    rdmPatch: 'Patch',
    rdmNoticeSetAddr: (addr, uid) => `Sent SET:DMX_START_ADDRESS (${addr}) to UID ${uid}.`,
    rdmNoticeAdded: (name, uid, addr) => `Added "${name}" (UID ${uid}) at CH ${addr}.`,
    rdmNoticePatchedMulti: (c) => `${c} RDM fixture${c > 1 ? 's' : ''} patched to Universe 1.`,
    rdmSerialUnsupportedErr:
      'Web Serial DMX/RDM requires Chrome or Edge in a secure context (HTTPS or localhost).',
    rdmSerialCancelErr: 'USB-DMX/RDM port selection cancelled or unavailable.',
    rdmServerRequiredNotice:
      'Art-Net UDP network RDM discovery requires the LightViana Host server. You can still use Scan USB-RDM directly.',

    liveEditNoFixtures:
      'No fixtures patched yet. Add a fixture in Fixtures & DMX first.',
    selectFixtureTitle: 'Select Fixture',
    manualControlCount: (c) =>
      `${c} fixture${c > 1 ? 's' : ''} in manual control`,
    allFollowingFx: 'All fixtures following FX engine',
    releaseAllBtn: 'Release All',
    liveEditTitleSuffix: 'Live Edit',
    liveEditSubtitle: 'Overrides Move FX and Color FX for this fixture in real time',
    manualControlActive: 'Manual Control Active',
    enableManualControl: 'Enable Manual Control',
    manualPanTiltLabel: 'Manual Pan / Tilt Position',
    fixtureDimmerLabel: 'Fixture Dimmer',
    fixtureColorLabel: 'Fixture Color',
    liveEditTip:
      'Tip: Click directly on any fixture in the Live Stage visualizer above to select it here immediately.',

    audioEngineTitle: 'Audio Beat Engine',
    audioEngineSubtitle:
      'Synchronize dimmers and color pulses to live audio or internal beat synth',
    clockOnly: 'Clock Only',
    testBeatSynth: 'Test Beat Synth',
    liveMic: 'Live Microphone',
    beatSensitivity: 'Beat Trigger Sensitivity',
    hwBackupTitle: 'Hardware & Show Backup',
    hwBackupSubtitle:
      'Connect USB-DMX adapters, MIDI consoles, or export show & MIDI files',
    usbDmxOutput: 'USB-DMX Serial Output',
    connectDmxBtn: 'Connect DMX',
    dmxDisconnected: 'Disconnected',
    dmxUnsupported: 'Web Serial DMX requires Chrome or Edge over HTTPS.',
    dmxConnected: 'Connected (250 kbps DMX-512)',
    dmxCancelled: 'Port selection cancelled or unavailable.',
    midiInputTitle: 'MIDI Controller Input',
    scanMidiBtn: 'Scan MIDI',
    midiUnsupported: 'Web MIDI API is not supported in this browser.',
    midiDenied: 'MIDI permission denied by browser.',
    midiNotScanned: 'Not scanned',
    midiReadySummary: (d, b) =>
      `${d} controller${d > 1 ? 's' : ''} ready · ${b} binding${b === 1 ? '' : 's'}`,
    midiNoHwSummary: (b) =>
      `No MIDI hardware detected via USB · ${b} binding${b === 1 ? '' : 's'}`,
    exportShowBtn: 'Export Show',
    importShowBtn: 'Import Show',

    midiTitle: 'MIDI Controller Mapping',
    midiSubtitle:
      'Bind external USB MIDI faders, encoders, and trigger pads to master dimmers, group submasters, and FX across all views',
    midiFilterDeviceAria: 'Filter MIDI input device',
    midiAllInputs: (c) => `All MIDI Inputs (${c})`,
    midiDisconnectedTag: '(Disconnected)',
    midiStandardMap: 'Standard CC Map',
    midiClearAll: 'Clear All',
    midiStatusUnsupported: 'Web MIDI API requires Chrome, Edge, or desktop Chromium',
    midiStatusDenied: 'MIDI access permission denied by browser',
    midiStatusActive: (i, b) =>
      `${i} MIDI input${i > 1 ? 's' : ''} active · ${b} mapping${b === 1 ? '' : 's'} saved`,
    midiStatusReady: (b) =>
      `Web MIDI Ready · No USB controller detected · ${b} mapping${b === 1 ? '' : 's'} saved`,
    midiStatusIdle: (b) =>
      `Click Scan MIDI to initialize USB controllers · ${b} mapping${b === 1 ? '' : 's'} saved`,
    midiLastInput: 'Last input:',
    midiMonitorHint: 'Move a MIDI fader or press a controller pad to monitor input',
    midiLearnActive: 'MIDI Learn Active:',
    midiLearnPrompt: 'Move a fader, turn an encoder, or press a pad on your controller to bind',
    midiCancelEsc: 'Cancel (Esc)',
    midiTabAll: (c) => `All Targets (${c})`,
    midiTabDimmers: 'Master & Groups (5)',
    midiTabTriggers: 'FX Triggers (12)',
    midiTabParams: 'FX Parameters (7)',
    midiTabAssigned: (c) => `Assigned (${c})`,
    midiSearchPlaceholder: 'Filter targets...',
    midiClearSearchAria: 'Clear search',
    midiNoBindingsTitle: 'No MIDI bindings configured yet',
    midiNoMatchTitle: 'No console targets match your current filter',
    midiNoBindingsHint:
      'Switch to All Targets and click Learn MIDI on any dimmer or FX control, or load the Standard CC Map.',
    midiNoMatchHint: 'Reset the search text or category filter to view all bindable controls.',
    midiShowAllBtn: 'Show All Targets',
    midiColTarget: 'Console Target',
    midiColLiveState: 'Live State',
    midiColAssignment: 'MIDI Assignment',
    midiColBehavior: 'Behavior',
    midiColActions: 'Actions',
    midiMsgTypeLabel: 'Msg Type',
    midiMsgCc: 'CC (Control Change)',
    midiMsgNote: 'Note On/Off',
    midiMsgPitchBend: 'Pitch Bend (14-bit)',
    midiChannelLabel: 'Channel',
    midiAnyChannel: 'Any (1–16)',
    midiDoneBtn: 'Done',
    midiUnassigned: 'Unassigned',
    midiInverted: 'Inverted',
    midiNormal: 'Normal',
    midiListening: 'Listening...',
    midiLearnBtn: 'Learn MIDI',
    midiEditTitle: 'Edit CC/Note manually',
    midiEditBtn: 'Edit',
    midiLiveStateActive: 'ACTIVE',
    midiLiveStateLive: 'LIVE',
    midiLiveStateFrozen: 'FROZEN',
    midiModeLabels: {
      fader: 'Fader (0–100%)',
      momentary: 'Momentary Hold',
      toggle: 'Toggle On/Off',
      trigger: 'One-Shot Trigger',
    },
    midiTargets: {
      master_dimmer: {
        label: 'Master Dimmer',
        categoryLabel: 'Master',
        description: 'Global console output dimmer (0–100%)',
      },
      group_beam: {
        label: 'Group: Beams',
        categoryLabel: 'Group Dimmer',
        description: 'Moving head & beam group submaster',
      },
      group_wash: {
        label: 'Group: Wash / Pars',
        categoryLabel: 'Group Dimmer',
        description: 'LED pars & wash fixtures submaster',
      },
      group_fx: {
        label: 'Group: FX / Bars',
        categoryLabel: 'Group Dimmer',
        description: 'Pixel bars & effect fixtures submaster',
      },
      group_smoke: {
        label: 'Group: Smoke / Haze',
        categoryLabel: 'Group Dimmer',
        description: 'Continuous haze / fog output level',
      },
      fx_strobe: {
        label: 'Flash: Strobe',
        categoryLabel: 'FX Trigger',
        description: 'High-speed white strobe burst',
      },
      fx_blinder: {
        label: 'Flash: Blinder',
        categoryLabel: 'FX Trigger',
        description: 'Full crowd blinder override',
      },
      fx_smoke: {
        label: 'Flash: Smoke Jet',
        categoryLabel: 'FX Trigger',
        description: 'Momentary fogger burst trigger',
      },
      fx_blackout: {
        label: 'Toggle: Blackout',
        categoryLabel: 'FX Trigger',
        description: 'Mute all DMX dimmer output',
      },
      fx_freeze: {
        label: 'Toggle: Freeze',
        categoryLabel: 'FX Trigger',
        description: 'Hold current DMX frame',
      },
      fx_tap_bpm: {
        label: 'Trigger: Tap BPM',
        categoryLabel: 'FX Trigger',
        description: 'Tap tempo beat detection',
      },
      fx_move_toggle: {
        label: 'Engine: Move FX On/Off',
        categoryLabel: 'FX Trigger',
        description: 'Enable or pause movement generator',
      },
      fx_color_toggle: {
        label: 'Engine: Color FX On/Off',
        categoryLabel: 'FX Trigger',
        description: 'Enable or pause color chase generator',
      },
      fx_gobo_spin: {
        label: 'Beam FX: Gobo Spin',
        categoryLabel: 'FX Trigger',
        description: 'Toggle moving head gobo rotation',
      },
      fx_prism: {
        label: 'Beam FX: 3-Facet Prism',
        categoryLabel: 'FX Trigger',
        description: 'Split beam into prism array',
      },
      fx_iris_pulse: {
        label: 'Beam FX: Iris Pulse',
        categoryLabel: 'FX Trigger',
        description: 'Beat-synced iris aperture pulse',
      },
      fx_uv_mode: {
        label: 'Beam FX: UV Wash',
        categoryLabel: 'FX Trigger',
        description: 'Deep ultraviolet wash override',
      },
      fx_move_speed: {
        label: 'Move FX: Speed',
        categoryLabel: 'FX Parameter',
        description: 'Pan/tilt movement speed (0–100%)',
      },
      fx_move_size: {
        label: 'Move FX: Size / Amplitude',
        categoryLabel: 'FX Parameter',
        description: 'Movement sweep range (0–100%)',
      },
      fx_color_speed: {
        label: 'Color FX: Speed',
        categoryLabel: 'FX Parameter',
        description: 'Color chase rate (0–100%)',
      },
      fx_color_fade: {
        label: 'Color FX: Fade Glide',
        categoryLabel: 'FX Parameter',
        description: 'RGB crossfade smoothness (0–100%)',
      },
      fx_color_shift: {
        label: 'Color FX: Phase Shift',
        categoryLabel: 'FX Parameter',
        description: 'Fixture-to-fixture color offset (0–100%)',
      },
      fx_beam_zoom: {
        label: 'Beam FX: Zoom / Spread',
        categoryLabel: 'FX Parameter',
        description: 'Beam aperture angle (0–100%)',
      },
      fx_strobe_rate: {
        label: 'Flash FX: Strobe Rate',
        categoryLabel: 'FX Parameter',
        description: 'Strobe flash frequency (2–24 Hz)',
      },
    },

    wifiPairingTitle: 'Wi-Fi Pairing Windows ↔ Android Tablet',
    wifiPairingSubtitle: 'Real-time WebSocket sync across your local Wi-Fi router',
    syncConnected: 'Live Synced',
    syncConnecting: 'Connecting...',
    syncReconnecting: 'Reconnecting...',
    syncStandalone: 'Standalone Offline Mode',
    standaloneNetworkNotice:
      'Running directly from a local folder (file://). Lighting engine, stage visualizer, presets, and backups run locally. Launch Start-LightViana-Windows.bat for Wi-Fi tablet sync and Art-Net UDP.',
    refreshWifiAria: 'Refresh Wi-Fi addresses',
    generatingQr: 'Generating QR...',
    scanQrHint: 'Scan with your Android Tablet camera',
    tabletUrlLabel: 'Wi-Fi URL for Android Tablet',
    detectingIp: 'Detecting local IP...',
    copiedBtn: 'Copied',
    copyBtn: 'Copy',
    detectedLanIps: 'Detected LAN IPs:',
    roomCodeLabel: 'Room Code',
    joinBtn: 'Join',
    deviceNameLabel: 'Device Name',
    roleWindows: 'Windows PC',
    roleAndroid: 'Android Tablet',
    roleWeb: 'Web',
    tabletModeOn: 'Tablet Touch Mode: Active',
    tabletModeOff: 'Tablet Touch Mode: Off',
    connectedDevicesIn: (r) => `Connected Devices in ${r}`,
    onlineCount: (c) => `${c} online`,
    waitingDevices: 'Waiting for devices...',
    thisDeviceTag: '(This device)',
    artNetTitle: 'Art-Net DMX Output (Windows)',
    artNetSubtitle: 'Sends real 512-channel ArtDmx UDP packets on port 6454',
    artNetTransmitting: 'Transmitting',
    artNetDisabled: 'Disabled',
    artNetIpLabel: 'Destination / Broadcast IP',
    artNetUniLabel: 'Universe',
    artNetPacketsSent: (c) => `Packets sent: ${c}`,
    artNetApplyBtn: 'Apply Art-Net',
    installTitle: 'Windows & Android Installation',
    installSubtitle: 'Install as a standalone app or run locally on Windows 10/11',
    downloadBatBtn: 'Download Windows .BAT',
    installStep1Before: '1. On Windows PC: run',
    installStep1After: '(uses Node.js 22+ on port 3000).',
    installStep2: '2. Connect Windows PC and Android Tablet to the same Wi-Fi network.',
    installStep3Before: '3. Scan the QR code above in Android Chrome and tap',
    installStep3Strong: 'Add to Home Screen',
    installStep3After: 'for fullscreen wireless DMX control.',
    netSettingsCardTitle: 'Application Settings',
    netSettingsCardSubtitle: 'Choose the display language for the entire console',

    pwaInstalled: 'Installed as Standalone App',
    pwaInstallBtn: 'Install App (Windows / Android)',
    pwaIosBtn: 'Install on iPad / iPhone',
    pwaIosModalTitle: 'Install on iPad / iPhone',
    pwaIosStep1Before: '1. Tap the',
    pwaIosStep1Strong: 'Share',
    pwaIosStep1After: 'button in Safari.',
    pwaIosStep2Before: '2. Scroll down and tap',
    pwaIosStep2Strong: 'Add to Home Screen',
    pwaManualHint:
      'Browser menu → Install LightViana (or Add to Home Screen in Android Chrome)',
    offlineBanner: 'Offline Mode — Local lighting engine active',

    channelLabels: {
      movingHead: [
        'Pan',
        'Pan Fine',
        'Tilt',
        'Tilt Fine',
        'Dimmer',
        'Shutter / Strobe',
        'Red',
        'Green',
        'Blue',
        'White',
        'Gobo',
        'Prism',
        'Zoom / Focus',
        'Pan/Tilt Speed',
        'Macro',
        'Control',
      ],
      ledPar: ['Dimmer', 'Red', 'Green', 'Blue', 'White', 'Strobe', 'Macro'],
      blinder: ['Warm Dimmer A', 'Warm Dimmer B', 'Strobe', 'Macro'],
      fogger: ['Smoke Output', 'Fan Speed'],
    },
  },

  'pt-PT': {
    appTitle: 'LightViana DMX — Consola de Iluminação em Direto',
    navAriaLabel: 'Secções da consola',
    navLive: 'Consola em Direto',
    navBank: 'Bank',
    navFixtures: 'Equipamentos & DMX',
    navEdit: 'Edição Direta',
    navAudio: 'Áudio & Sinc.',
    navNetwork: 'Wi-Fi & Dispositivos',
    settingsButton: 'Configurações',
    savePresetButton: 'Guardar Preset',

    settingsTitle: 'Configurações',
    settingsSubtitle: 'Preferências da aplicação e idioma da consola',
    settingsLanguageLabel: 'Idioma da Aplicação',
    settingsLanguageHint: 'Alterna toda a interface entre Português (Portugal) e Inglês.',
    settingsInterfaceLabel: 'Interface e Toque',
    settingsTabletModeLabel: 'Modo Tátil para Tablet',
    settingsTabletModeHint: 'Desativa a seleção acidental de texto e otimiza os controlos para ecrãs táteis.',
    settingsOn: 'Ativo',
    settingsOff: 'Desligado',
    settingsDone: 'Concluído',
    settingsOfflineLabel: 'Modo Offline e Instalação da App',
    settingsOfflineHint:
      'Equipamentos, presets, scenes, visualizador 3D, motor DMX, sincronização áudio e etiquetas funcionam 100% localmente sem internet.',
    settingsOfflineReady: 'Guardado em cache local para abrir offline',
    settingsOfflineSyncing: 'A preparar cache offline...',
    settingsOfflineConnOnline: 'Rede Disponível',
    settingsOfflineConnOffline: 'Sem Internet (Modo Offline Ativo)',
    settingsBackupLabel: 'Cópia de Segurança e Restauro',
    settingsBackupHint:
      'Descarrega ou repõe todas as alterações: presets, banks, scenes, equipamentos, mapeamentos MIDI e preferências.',
    settingsDownloadBackup: 'Descarregar Backup (.json)',
    settingsUploadBackup: 'Carregar Backup (.json)',
    settingsBackupDownloaded: (p, b, f) =>
      `Backup descarregado (${p} presets, ${b} banks, ${f} equipamentos).`,
    settingsBackupRestored:
      'Backup restaurado com sucesso. Todas as alterações do utilizador foram aplicadas.',
    settingsBackupInvalid:
      'Ficheiro de backup inválido. Seleciona um ficheiro JSON válido do LightViana.',
    settingsResetLabel: 'Reset de Fábrica',
    settingsResetHint:
      'Repõe a aplicação para o estado original de fábrica (apaga presets, scenes, equipamentos e mapeamentos MIDI personalizados).',
    settingsResetBtn: 'Reset de Fábrica',
    settingsResetConfirmPrompt:
      'Tens a certeza? Todos os presets, banks, scenes, equipamentos e mapeamentos MIDI personalizados serão apagados.',
    settingsResetConfirmBtn: 'Confirmar Reset de Fábrica',
    settingsResetCancelBtn: 'Cancelar',
    settingsResetSuccess: 'Aplicação reposta para as definições originais de fábrica.',
    settingsAdminLabel: 'Modo Administrador — Download Completo da App',
    settingsAdminHint:
      'Inicia sessão de administrador para descarregar os pacotes completos e funcionais para Windows e Android.',
    settingsAdminUsernameLabel: 'Nome de Administrador',
    settingsAdminPasswordLabel: 'Palavra-passe',
    settingsAdminUnlockBtn: 'Desbloquear Modo Administrador',
    settingsAdminLockBtn: 'Bloquear',
    settingsAdminUnlockedBadge: (user) => `Desbloqueado (${user})`,
    settingsAdminInvalid: 'Nome ou palavra-passe de administrador incorretos.',
    settingsAdminServerOffline:
      'Os downloads de administrador requerem o servidor LightViana ativo (executa Start-LightViana-Windows.bat ou acede pelo URL web).',
    settingsAdminDownloadWindows: 'Download App Windows (.zip)',
    settingsAdminDownloadAndroid: 'Download App Android (.zip)',
    settingsAdminPackageHint:
      'O ZIP Windows inclui a app autónoma por pasta (index.html) + servidor anfitrião. O ZIP Android inclui a app offline para tablet + projeto Android Studio pronto a gerar APK.',
    settingsAdminDownloaded: (pkgName) => `Pacote "${pkgName}" descarregado com sucesso.`,
    settingsAdminDownloadError: 'Falha ao gerar o pacote da aplicação.',
    settingsAdminChangeCredsBtn: 'Alterar Nome e Password',
    settingsAdminChangeCredsTitle: 'Alterar Credenciais de Administrador',
    settingsAdminCurrentPasswordLabel: 'Password Atual',
    settingsAdminNewUsernameLabel: 'Novo Nome',
    settingsAdminNewPasswordLabel: 'Nova Password',
    settingsAdminConfirmPasswordLabel: 'Confirmar Nova Password',
    settingsAdminSaveCredsBtn: 'Guardar Alterações',
    settingsAdminCancelCredsBtn: 'Cancelar',
    settingsAdminCredsUpdated: (user) =>
      `Credenciais de administrador atualizadas para "${user}".`,
    settingsAdminPasswordMismatch:
      'A nova password e a confirmação não coincidem.',
    settingsAdminPasswordTooShort:
      'A nova password deve ter pelo menos 6 caracteres.',
    settingsAdminUsernameInvalid:
      'O nome de administrador deve ter entre 2 e 32 caracteres.',
    settingsAdminCurrentPasswordInvalid: 'A password atual está incorreta.',
    settingsAdminCredsUpdateError:
      'Falha ao atualizar as credenciais de administrador.',

    readoutMaster: 'GERAL',
    readoutBeams: 'BEAMS',
    readoutWash: 'WASH',
    readoutFx: 'FX',
    readoutSmoke: 'FUMO',
    layoutFxDeck: 'Mesa FX',
    layoutSplit: 'FX + Faders',
    layoutFaderWing: 'Consola Faders',

    audioMicError:
      'A permissão do microfone foi recusada ou está indisponível. Usa o Sintetizador de Batida ou permite o acesso ao microfone.',

    stageAriaLabel: 'Visualizador de Palco 3D em Direto',
    stageLiveTitle: 'Palco em Direto',
    stageFixturesCount: (c) => `${c} Equipamentos`,
    stageFrozen: 'Congelado',
    stageBlackout: 'Blackout',
    stageChannelPrefix: 'CN',
    stageEditFixture: 'Editar Equipamento',
    stageClose: 'Fechar',

    moveFxAriaLabel: 'Motor Move FX',
    moveFxTitle: 'Move FX',
    moveFxSubtitle: 'Geradores de Pan e Tilt',
    statusActive: 'Ativo',
    statusOff: 'Desativado',
    sliderSpeed: 'Velocidade',
    sliderSize: 'Amplitude',
    sliderFan: 'Abertura (Fan)',
    movePatterns: {
      circle: 'Círculo',
      figure8: 'Figura 8',
      pan_sweep: 'Varredura Pan',
      tilt_wave: 'Onda Tilt',
      cross: 'Cruz X',
      ballyhoo: 'Ballyhoo',
      diamond: 'Diamante',
      snap_home: 'Centro Fixo',
    },

    colorFxAriaLabel: 'Motor Color FX',
    colorFxTitle: 'Color FX',
    colorFxSubtitle: 'Paleta RGBW e sequências',
    livePalette: 'Paleta em Direto',
    slotPrimary: 'Primária',
    slotSecondary: 'Secundária',
    slotAccent: 'Destaque',
    selectColorSlotAria: (s) => `Selecionar cor ${s}`,
    swatchLabel: (s) => `Amostra ${s}`,
    customColor: 'Personalizada',
    setColorAria: (h) => `Definir cor ${h}`,
    sliderFadeSmooth: 'Suavização (Fade)',
    sliderPhaseShift: 'Desfasamento',
    colorPatterns: {
      rainbow: 'Arco-Íris',
      dual_chase: 'Sequência Dupla',
      pulse_fade: 'Pulso Suave',
      ember: 'Brasa Quente',
      ocean: 'Deriva Oceano',
      sparkle: 'Cintilação',
      split: 'Esq. / Dir.',
      static_wash: 'Wash Estático',
    },

    flashCenterAriaLabel: 'Flash FX e Controlo Geral',
    tempoSync: 'Sinc. de Tempo',
    increaseBpm: 'Aumentar BPM',
    decreaseBpm: 'Diminuir BPM',
    masterDimmerLabel: 'Dimmer Geral (Master)',
    audioPulse: 'Pulso Áudio',
    audioModeOff: 'Desl.',
    audioModeSynth: 'Sint. Batida',
    audioModeMic: 'Mic',
    flashFxTitle: 'Flash FX',
    modeHold: 'Premir',
    modeLatch: 'Fixo',
    flashSmoke: 'Fumo',
    flashBlinder: 'Blinder',
    flashStrobe: 'Strobe',
    freezeActive: 'Congelado',
    freezeIdle: 'Congelar',
    blackoutActive: 'Blackout Ativo',
    blackoutIdle: 'Blackout',
    strobeRate: 'Frequência Strobe',
    panTiltCenter: 'Centro Pan / Tilt',
    centerAction: 'Centrar',
    panTiltPadAria: 'Painel XY de Centro Pan e Tilt',
    beamFxTitle: 'Efeitos de Feixe',
    zoomLabel: 'Zoom',
    goboSpin: 'Rotação Gobo',
    prism3x: 'Prisma 3x',
    irisPulse: 'Pulso Íris',
    uvLight: 'Luz UV',

    faderTooltip: 'Arrasta verticalmente · Duplo clique para repor',

    stripTitle: 'Faders de Dimmer, Color Fade e FX',
    stripSubtitle: 'Geral · Grupos · Velocidade & Fade · Cores por Equipamento',
    stripEquipBtn: 'Cor & Dimmer Equipamento',
    resetDimmers: 'Repor Dimmers',
    fixturesAndColorsArrow: 'Equipamentos & Cores →',
    faderMaster: 'Geral',
    faderMasterSub: 'TODOS',
    faderBeams: 'Beams',
    faderGroupSub: 'GRUPO',
    faderWash: 'Wash',
    faderParBarSub: 'PAR/BAR',
    faderBlinders: 'Blinders',
    faderFxGrpSub: 'GRP FX',
    faderSmoke: 'Fumo',
    faderHazeSub: 'HAZE',
    faderMoveSpd: 'Vel. Mov.',
    faderMoveSize: 'Amp. Mov.',
    faderColorSpd: 'Vel. Cor',
    faderColorFade: 'Color Fade',
    faderEquipBtn: 'EQUIP.',
    faderBeamZoom: 'Zoom Feixe',
    faderOpticSub: 'ÓTICA',
    faderStrobe: 'Strobe',
    faderStrobeHzLabel: 'Strobe Hz',
    faderShiftColor: 'Desf. Cor',
    faderSpreadSub: 'ESPALHAR',
    faderFanMove: 'Fan Mov.',
    faderPhaseSub: 'FASE',
    faderSmoothSub: 'SUAVE',
    faderGlobalSub: 'GLOBAL',
    faderMovingSub: 'MOVING',
    faderHazeOutSub: 'SAÍDA HAZE',
    faderFlashFxSub: 'FLASH FX',
    equipDrawerTitle: 'Cor & Dimmer por Equipamento',
    equipDrawerSubtitle: 'Seleciona qualquer equipamento para mudar a cor em direto',
    autoColorFx: 'Auto Color FX',
    resetAllColors: (c) => `Repor Todas Cores (${c})`,
    closeBtn: 'Fechar',
    setHexOnFixtureAria: (h, n) => `Definir cor ${h} em ${n}`,
    customColorForAria: (n) => `Cor personalizada para ${n}`,
    dimmerFixtureLabel: (n) => `Dimmer ${n}`,
    wingTitle: 'Consola de Faders — Dimmers, Cores e Canais DMX',
    wingSubtitle: 'Faders táteis sincronizados em direto com Windows Art-Net e Tablet Android',
    wingTabGroups: 'Grupos & FX',
    wingTabFixtures: (c) => `Equipamentos & Cor (${c})`,
    wingTabChannels: 'Canais do Equipamento',
    wingTabDmx512: 'Bancos DMX 512',
    wingTabUniverse: 'Monitor Universo',
    universeTitle: 'Monitor em Direto — Universo 1',
    universeSubtitle: 'Leitura hexadecimal e decimal em tempo real nos 512 canais DMX',
    universeFormatBoth: 'DEC + HEX',
    universeFormatDec: 'DEC',
    universeFormatHex: 'HEX',
    universeFilterAll: 'Todos (512)',
    universeFilterActive: 'Ativos (> 0)',
    universeFilterPatched: 'Endereçados',
    universeFilterOverridden: 'Forçados',
    universeSearchPlaceholder: 'Filtrar canal (1-512) ou equipamento...',
    universePauseBtn: 'Pausar Leitura',
    universeResumeBtn: 'Leitura em Direto',
    universeStatsLine: (active, patched, overrides) =>
      `512 ch · ${active} ativos · ${patched} endereçados · ${overrides} forçados`,
    universeEmptyFiltered: 'Nenhum canal DMX corresponde ao filtro atual.',
    universeResetFilters: 'Mostrar Todos os 512 Canais',
    universeUnpatchedLabel: 'Livre',
    universeOverriddenTag: 'OVR',
    universeInspectorChannel: (ch) => `DMX ${String(ch).padStart(3, '0')}`,
    universeInspectorRelease: 'Libertar para FX',
    universeInspectorSetZero: '000 (0x00)',
    universeInspectorSetFull: '255 (0xFF)',
    universeLabelPlaceholder: 'Etiqueta...',
    universeCustomLabelAria: (ch) => `Etiqueta personalizada para o canal DMX ${ch}`,
    universeInspectorLabelAria: (ch) => `Editar etiqueta do canal DMX ${ch}`,
    universeClearLabelAria: (ch) => `Limpar etiqueta do canal DMX ${ch}`,
    universeShiftClickHint: 'Shift+Clique para seleção múltipla',
    universeBulkSelectedSummary: (count, minCh, maxCh) =>
      `${count} canais selecionados · CH ${String(minCh).padStart(3, '0')}–${String(maxCh).padStart(3, '0')}`,
    universeBulkLabelPlaceholder: 'Etiqueta para os canais selecionados...',
    universeBulkLabelAria: 'Etiqueta em massa para os canais DMX selecionados',
    universeBulkApplyBtn: 'Aplicar Etiqueta',
    universeBulkClearLabelsBtn: (count) =>
      count > 0 ? `Limpar Etiquetas (${count})` : 'Limpar Etiquetas',
    universeBulkDeselectBtn: 'Limpar Seleção',
    wingGroupsHeader: 'Dimmers Gerais e de Grupos + Parâmetros do Motor FX em Direto',
    wingColorPerFixArrow: 'Cor & Dimmer por Equipamento →',
    allGroups100: 'Todos Grupos 100%',
    zeroGroups: 'Zerar Grupos',
    fixtureColorFadeDimmerTitle: (n) => `${n} — Cor, Fade & Dimmer`,
    fixedColorBadge: (h) => `Cor Fixa ${h}`,
    followingGlobalColorFx: 'A seguir Color FX global',
    returnToColorFx: 'Voltar ao Color FX',
    clearColorsCount: (c) => `Limpar Cores (${c})`,
    allDimmers100: 'Todos Dimmers 100%',
    unmuteAll: 'Reativar Todos',
    quickPaletteFor: (n) => `Paleta Rápida para ${n}`,
    fixturePaletteTip:
      'Dica: Clica em qualquer equipamento na fila de faders abaixo para trocar a cor ou ajustar os faders RGB / Dimmer individualmente.',
    faderRed: 'Vermelho',
    faderGreen: 'Verde',
    faderBlue: 'Azul',
    btnFixedColor: 'COR FIXA',
    btnColorEdit: 'COR / EDIT',
    btnMute: 'MUDO',
    btnFlash: 'FLASH',
    releaseFixture: (c) => `Libertar Equipamento (${c})`,
    btnRelease: 'LIBERTAR',
    btnAutoFx: 'FX AUTO',
    noFixturesPatched: 'Sem equipamentos endereçados.',
    dmxUpperBanksAria: 'Bancos DMX 512 superiores (257 a 512)',
    releaseAllCount: (c) => `Libertar Todos (${c})`,
    btnRelShort: 'LIB.',
    btnLive: 'DIRETO',

    presetsAriaLabel: 'Presets de Espetáculo',
    presetsTitle: 'Presets',
    presetsCount: (c) => `${c} Cenas`,
    saveCurrentPreset: 'Guardar Atual',
    deletePresetAria: (n) => `Apagar preset ${n}`,
    saveModalTitle: 'Guardar Preset do Espetáculo',
    closeModalAria: 'Fechar janela',
    presetNameLabel: 'Nome do Preset',
    presetNamePlaceholder: 'ex.: Drop Principal Palco',
    cancelBtn: 'Cancelar',
    savePresetBtn: 'Guardar Preset',

    bankManagerTitle: 'Bank — Gestor de Scenes',
    bankManagerSubtitle:
      'Cria, organiza e dispara Scenes completas (FX + Dimmers + Cores por Equipamento)',
    undoBtn: 'Anular',
    redoBtn: 'Refazer',
    undoTooltip: (l) => `Anular: ${l} (Ctrl+Z)`,
    undoNothingTooltip: 'Nada para anular (Ctrl+Z)',
    redoTooltip: (l) => `Refazer: ${l} (Ctrl+Y)`,
    redoNothingTooltip: 'Nada para refazer (Ctrl+Y)',
    historyTooltip: 'Ver histórico de alterações da consola e Scenes',
    autoCycleLabel: 'Auto-Sequência:',
    autoCycleManual: 'Manual',
    autoCycleBeats: (b) => `${b} Tempos`,
    newBankBtn: 'Novo Bank',
    historyShortcutHint: 'Histórico de estados para recuperação rápida',
    closeHistoryBtn: 'Fechar histórico',
    historyEmpty:
      'Ainda não existem alterações registadas nesta sessão. Cria, grava, apaga ou ajusta uma Scene para registar estados anteriores.',
    historyBeforePrefix: (l) => `Antes de: ${l}`,
    newBankPlaceholder: 'Nome do Bank (ex.: Bank 3 · Sunset)',
    selectBankColorAria: (h) => `Selecionar cor do bank ${h}`,
    createBankBtn: 'Criar Bank',
    deleteBankTitle: 'Apagar Bank selecionado',
    deleteBankBtn: 'Apagar Bank',
    newScenePlaceholder: (b) => `Nova Scene em ${b}...`,
    sceneTagLabel: 'Etiqueta:',
    sceneTagColorAria: (h) => `Cor de etiqueta da scene ${h}`,
    createSceneBtn: 'Criar Scene (Capturar Look Atual)',
    bankEmptyTextBefore: 'Este Bank ainda não tem Scenes. Ajusta o visual na mesa abaixo e clica em',
    bankEmptyTextStrong: 'Criar Scene (Capturar Look Atual)',
    editSceneSave: 'Guardar',
    sceneCustomColors: (c) => `${c} cores`,
    sceneActive: 'Ativa',
    sceneTrigger: 'Disparar',
    sceneOverwriteTitle: 'Atualizar Scene com o look atual',
    sceneOverwriteBtn: 'Gravar',
    sceneEditTitle: 'Editar nome e etiqueta da Scene',
    sceneDuplicateTitle: 'Duplicar Scene',
    sceneDeleteTitle: 'Apagar Scene',
    bankDeckTitle: 'Mesa de Criação de Scenes (Move FX · Flash · Color FX · Faders)',
    hideFadersBtn: 'Ocultar Faders',
    showFadersBtn: 'Mostrar Faders',
    minimizeFxDeckBtn: 'Minimizar Mesa FX',
    expandFxDeckBtn: 'Expandir Mesa FX',
    undoFeedbackUndone: (l) => `Anulado: ${l}`,
    undoFeedbackRedone: (l) => `Refeito: ${l}`,
    undoFeedbackRestored: (l) => `Restaurado estado anterior a: ${l}`,
    chkTriggerScene: (n) => `Disparar Scene «${n}»`,
    chkCreateBank: (n) => `Criar Bank «${n}»`,
    chkDeleteBank: (n) => `Apagar Bank «${n}»`,
    chkCreateScene: (n) => `Criar Scene «${n}»`,
    chkSaveScene: (n) => `Gravar Scene «${n}»`,
    chkEditScene: (n) => `Editar Scene «${n}»`,
    chkDuplicateScene: (n) => `Duplicar Scene «${n}»`,
    sceneCopySuffix: '(Cópia)',
    chkDeleteScene: (n) => `Apagar Scene «${n}»`,
    chkAdjustMoveFx: 'Ajustar Move FX',
    chkAdjustColorFx: 'Ajustar Color FX',
    chkAdjustFlashFx: 'Ajustar Flash FX',
    chkAdjustBeamFx: 'Ajustar Beam FX',
    chkTapBpm: 'Tap BPM',
    chkAdjustBpm: 'Ajustar BPM',
    chkAdjustMasterDimmer: 'Ajustar Master Dimmer',
    chkAdjustGroupDimmers: 'Ajustar Dimmers de Grupo',
    chkAdjustFixtureDimmer: 'Ajustar Dimmer Equipamento',
    chkResetFixtureDimmers: 'Repor Dimmers dos Equipamentos',
    chkToggleFixtureMute: 'Alternar Mute Equipamento',
    chkUnmuteAllFixtures: 'Remover Mute de Todos os Equipamentos',
    chkChangeFixtureColor: 'Alterar Cor Equipamento',
    chkClearFixtureColors: 'Limpar Cores por Equipamento',
    chkAdjustDmxChannel: (ch) => `Ajustar Canal DMX ${ch}`,
    chkClearManualDmx: 'Limpar Canais DMX Manuais',

    dmxMatrixTitle: 'Saída DMX em Direto — Universo 1',
    dmxMatrixSubtitle: 'Matriz de valores em tempo real dos canais 001–512',
    dmxFreeChannel: 'Livre',
    dmxHoverHint: 'Passa o rato sobre qualquer canal para inspecionar o valor DMX',
    patchedFixturesTitle: 'Equipamentos Endereçados',
    totalLabel: 'Total',
    searchFixturesPlaceholder: 'Pesquisar equipamentos...',
    filterAll: 'Todos',
    filterBeams: 'Beams',
    filterWash: 'Wash',
    filterFx: 'FX',
    resetRigBtn: 'Repor Rig',
    noFixtureMatch: 'Nenhum equipamento corresponde ao filtro.',
    clearFiltersBtn: 'Limpar filtros',
    colFixture: 'Equipamento',
    colDmxAddr: 'End. DMX',
    colChannels: 'Canais',
    colInvert: 'Inverter',
    colAction: 'Ação',
    hideChannelMap: 'Ocultar mapa de canais',
    showChannelMap: 'Ver mapa de canais',
    fixtureLibraryTitle: 'Biblioteca de Equipamentos',
    onlineSearchTab: 'Pesquisa Online',
    uploadFileTab: 'Carregar Ficheiro',
    dropProfileHint: 'Larga aqui um ficheiro OFL .json, DMX .csv ou .ssl2',
    selectProfileFileBtn: 'Selecionar .json / .csv / .ssl2',
    samplesLabel: 'Modelos:',
    discardProfileAria: 'Descartar perfil importado',
    dmxModeLabel: 'Modo DMX',
    stageBehaviorLabel: 'Comportamento em Palco',
    qtyLabel: 'Qtd.',
    channelCountLabel: 'Número de Canais',
    patchImportedBtn: (qty, addr) =>
      `Endereçar ${qty > 1 ? `${qty}x ` : ''}no CH ${addr}`,
    quickAddTitle: 'Adicionar Equipamento Rápido',
    quickAddSubtitle: 'Endereça automaticamente no próximo canal DMX livre',
    fixtureProfileLabel: 'Perfil do Equipamento',
    customNameLabel: 'Nome Personalizado',
    customNamePlaceholder: 'ex.: Beam Truss #5',
    nextFreeDmxLabel: 'Próximo Endereço DMX Livre',
    patchToUniverseBtn: 'Endereçar no Universo',
    importUnsupportedErr:
      'Formato não suportado. Carrega um ficheiro OFL .json, DMX .csv ou .ssl2.',
    importReadErr: 'Falha ao ler o perfil do equipamento.',
    importInsufficientChErr: (needed, addr) =>
      `Canais DMX insuficientes no Universo 1 (necessários ${needed}ch a partir do CH ${addr}).`,
    importPatchedNotice: (qty, name, ch, addr) =>
      `Endereçado ${qty}x ${name} (${ch}ch) a partir do CH ${addr}.`,
    fixtureTypeLabels: {
      moving_head: 'Cabeça Móvel Beam',
      led_par: 'Par LED RGBW',
      pixel_bar: 'Barra Pixel LED',
      blinder: 'Blinder de Público',
      fogger: 'Máquina de Fumo / Haze',
    },

    oflTitle: 'Biblioteca Online (Open Fixture Library)',
    oflSearchPlaceholder: 'Pesquisar marca ou modelo (ex.: Chauvet, ADJ, Spot)...',
    oflAllManufacturers: 'Todos os Fabricantes',
    oflRetry: 'Tentar Novamente',
    oflEmpty: 'Nenhum equipamento encontrado para esta pesquisa.',
    oflLoad: 'Carregar',
    oflSearchError: 'Falha ao pesquisar na biblioteca online de equipamentos.',
    oflDownloadError: 'Não foi possível descarregar o perfil do equipamento.',
    oflOfflineNotice:
      'Modo offline: a mostrar perfis DMX locais integrados e equipamentos em cache.',
    oflOfflineTag: 'Offline',

    rdmTitle: 'Autodiscovery RDM (ANSI E1.20 · Art-RDM)',
    rdmSubtitle:
      'Deteção automática de luminárias RDM na rede Art-Net (UDP 6454) ou via interface USB-DMX/RDM',
    rdmArtNetIp: 'IP Art-Net',
    rdmUni: 'Uni',
    rdmForceFlush: 'Forçar Flush TOD',
    rdmScanning: 'A sondar RDM...',
    rdmDiscoverBtn: 'Procurar Equipamentos RDM',
    rdmScanUsbBtn: 'Sondar USB-RDM',
    rdmNodesLabel: 'Nós Art-Net:',
    rdmRespondersLabel: 'Respondedores RDM:',
    rdmReadyHint:
      'Motor RDM pronto · Envia OpPoll + OpTodRequest + GET:DEVICE_INFO para detetar UIDs automaticamente',
    rdmHideLog: 'Ocultar Log RDM',
    rdmViewLog: (c) => `Ver Log RDM (${c})`,
    rdmLogEmpty: 'Ainda não foram enviados pacotes RDM nesta sessão.',
    rdmActive: 'RDM Ativo',
    rdmUnsupported: 'Sem RDM',
    rdmEmptyResponded: 'Nenhum equipamento RDM respondeu nesta sondagem.',
    rdmEmptyIdle: 'Nenhum equipamento RDM sondado nesta sessão.',
    rdmEmptyHintBefore:
      'Liga o teu nó Art-Net/RDM à mesma rede Wi-Fi/Ethernet (ou seleciona um adaptador USB-DMX com suporte RDM) e clica em',
    rdmEmptyHintAfter: 'para descobrir UIDs, modelos e canais DMX automaticamente.',
    rdmAutoResolve: 'Resolver conflitos de canais DMX automaticamente ao importar',
    rdmImportNew: (c) => `Importar ${c} Novo${c > 1 ? 's' : ''} para Patch`,
    rdmImportAll: (c) => `Importar Todos (${c})`,
    rdmColUid: 'UID RDM',
    rdmColFixtureMfg: 'Equipamento / Fabricante',
    rdmColCategory: 'Categoria',
    rdmColFootprint: 'Pegada',
    rdmColDmxAddr: 'End. DMX',
    rdmColActions: 'Ações',
    rdmConflictTitle: 'Sobreposição com equipamento já endereçado',
    rdmIdentifying: 'A identificar',
    rdmIdentify: 'Identificar',
    rdmPatched: 'Endereçado',
    rdmPatch: 'Endereçar',
    rdmNoticeSetAddr: (addr, uid) =>
      `Enviado SET:DMX_START_ADDRESS (${addr}) para UID ${uid}.`,
    rdmNoticeAdded: (name, uid, addr) =>
      `Adicionado "${name}" (UID ${uid}) no CH ${addr}.`,
    rdmNoticePatchedMulti: (c) =>
      `${c} equipamento${c > 1 ? 's' : ''} RDM endereçado${c > 1 ? 's' : ''} no Universo 1.`,
    rdmSerialUnsupportedErr:
      'Web Serial DMX/RDM requer Chrome ou Edge num contexto seguro (HTTPS ou localhost).',
    rdmSerialCancelErr: 'Seleção de porta USB-DMX/RDM cancelada ou indisponível.',
    rdmServerRequiredNotice:
      'A sondagem RDM por rede Art-Net UDP requer o servidor LightViana ativo. Podes continuar a usar Sondar USB-RDM diretamente.',

    liveEditNoFixtures:
      'Ainda não existem equipamentos endereçados. Adiciona primeiro um equipamento em Equipamentos & DMX.',
    selectFixtureTitle: 'Selecionar Equipamento',
    manualControlCount: (c) =>
      `${c} equipamento${c > 1 ? 's' : ''} em controlo manual`,
    allFollowingFx: 'Todos os equipamentos a seguir o motor FX',
    releaseAllBtn: 'Libertar Todos',
    liveEditTitleSuffix: 'Edição Direta',
    liveEditSubtitle: 'Substitui o Move FX e o Color FX para este equipamento em tempo real',
    manualControlActive: 'Controlo Manual Ativo',
    enableManualControl: 'Ativar Controlo Manual',
    manualPanTiltLabel: 'Posição Manual Pan / Tilt',
    fixtureDimmerLabel: 'Dimmer do Equipamento',
    fixtureColorLabel: 'Cor do Equipamento',
    liveEditTip:
      'Dica: Clica diretamente em qualquer equipamento no visualizador Palco em Direto acima para o selecionar aqui de imediato.',

    audioEngineTitle: 'Motor de Batida Áudio',
    audioEngineSubtitle:
      'Sincroniza dimmers e pulsos de cor com áudio em direto ou sintetizador interno',
    clockOnly: 'Apenas Relógio',
    testBeatSynth: 'Sintetizador de Batida',
    liveMic: 'Microfone em Direto',
    beatSensitivity: 'Sensibilidade de Batida',
    hwBackupTitle: 'Hardware & Cópia do Espetáculo',
    hwBackupSubtitle:
      'Liga adaptadores USB-DMX, consolas MIDI ou exporta ficheiros do espetáculo e MIDI',
    usbDmxOutput: 'Saída Série USB-DMX',
    connectDmxBtn: 'Ligar DMX',
    dmxDisconnected: 'Desligado',
    dmxUnsupported: 'Web Serial DMX requer Chrome ou Edge em HTTPS.',
    dmxConnected: 'Ligado (250 kbps DMX-512)',
    dmxCancelled: 'Seleção de porta cancelada ou indisponível.',
    midiInputTitle: 'Entrada Controlador MIDI',
    scanMidiBtn: 'Procurar MIDI',
    midiUnsupported: 'A API Web MIDI não é suportada neste navegador.',
    midiDenied: 'Permissão MIDI recusada pelo navegador.',
    midiNotScanned: 'Não sondado',
    midiReadySummary: (d, b) =>
      `${d} controlador${d > 1 ? 'es' : ''} pronto${d > 1 ? 's' : ''} · ${b} associação${b === 1 ? '' : 'ões'}`,
    midiNoHwSummary: (b) =>
      `Nenhum hardware MIDI detetado via USB · ${b} associação${b === 1 ? '' : 'ões'}`,
    exportShowBtn: 'Exportar Show',
    importShowBtn: 'Importar Show',

    midiTitle: 'Mapeamento de Controlador MIDI',
    midiSubtitle:
      'Associa faders, potenciómetros e pads USB MIDI externos aos dimmers gerais, submasters de grupo e FX em todas as vistas',
    midiFilterDeviceAria: 'Filtrar dispositivo de entrada MIDI',
    midiAllInputs: (c) => `Todas as Entradas MIDI (${c})`,
    midiDisconnectedTag: '(Desligado)',
    midiStandardMap: 'Mapa CC Padrão',
    midiClearAll: 'Limpar Tudo',
    midiStatusUnsupported: 'A API Web MIDI requer Chrome, Edge ou Chromium no computador',
    midiStatusDenied: 'Permissão de acesso MIDI recusada pelo navegador',
    midiStatusActive: (i, b) =>
      `${i} entrada${i > 1 ? 's' : ''} MIDI ativa${i > 1 ? 's' : ''} · ${b} mapeamento${b === 1 ? '' : 's'} guardado${b === 1 ? '' : 's'}`,
    midiStatusReady: (b) =>
      `Web MIDI Pronto · Nenhum controlador USB detetado · ${b} mapeamento${b === 1 ? '' : 's'} guardado${b === 1 ? '' : 's'}`,
    midiStatusIdle: (b) =>
      `Clica em Procurar MIDI para inicializar controladores USB · ${b} mapeamento${b === 1 ? '' : 's'} guardado${b === 1 ? '' : 's'}`,
    midiLastInput: 'Última entrada:',
    midiMonitorHint: 'Move um fader MIDI ou prime um pad no controlador para monitorizar',
    midiLearnActive: 'MIDI Learn Ativo:',
    midiLearnPrompt: 'Move um fader, roda um encoder ou prime um pad no controlador para associar',
    midiCancelEsc: 'Cancelar (Esc)',
    midiTabAll: (c) => `Todos (${c})`,
    midiTabDimmers: 'Geral & Grupos (5)',
    midiTabTriggers: 'Disparos FX (12)',
    midiTabParams: 'Parâmetros FX (7)',
    midiTabAssigned: (c) => `Associados (${c})`,
    midiSearchPlaceholder: 'Filtrar alvos...',
    midiClearSearchAria: 'Limpar pesquisa',
    midiNoBindingsTitle: 'Ainda não existem associações MIDI configuradas',
    midiNoMatchTitle: 'Nenhum controlo corresponde ao filtro atual',
    midiNoBindingsHint:
      'Muda para Todos e clica em Aprender MIDI em qualquer dimmer ou efeito FX, ou carrega o Mapa CC Padrão.',
    midiNoMatchHint: 'Limpa o texto de pesquisa ou o filtro de categoria para ver todos os controlos.',
    midiShowAllBtn: 'Mostrar Todos',
    midiColTarget: 'Alvo na Consola',
    midiColLiveState: 'Estado Atual',
    midiColAssignment: 'Atribuição MIDI',
    midiColBehavior: 'Comportamento',
    midiColActions: 'Ações',
    midiMsgTypeLabel: 'Tipo Msg',
    midiMsgCc: 'CC (Control Change)',
    midiMsgNote: 'Nota On/Off',
    midiMsgPitchBend: 'Pitch Bend (14-bit)',
    midiChannelLabel: 'Canal',
    midiAnyChannel: 'Qualquer (1–16)',
    midiDoneBtn: 'Concluir',
    midiUnassigned: 'Por associar',
    midiInverted: 'Invertido',
    midiNormal: 'Normal',
    midiListening: 'A escutar...',
    midiLearnBtn: 'Aprender MIDI',
    midiEditTitle: 'Editar CC/Nota manualmente',
    midiEditBtn: 'Editar',
    midiLiveStateActive: 'ATIVO',
    midiLiveStateLive: 'DIRETO',
    midiLiveStateFrozen: 'CONGELADO',
    midiModeLabels: {
      fader: 'Fader (0–100%)',
      momentary: 'Premir Momentâneo',
      toggle: 'Alternar Ligar/Desligar',
      trigger: 'Disparo Único',
    },
    midiTargets: {
      master_dimmer: {
        label: 'Dimmer Geral (Master)',
        categoryLabel: 'Geral',
        description: 'Dimmer global de saída da consola (0–100%)',
      },
      group_beam: {
        label: 'Grupo: Beams',
        categoryLabel: 'Dimmer de Grupo',
        description: 'Submaster do grupo de cabeças móveis e beams',
      },
      group_wash: {
        label: 'Grupo: Wash / Pars',
        categoryLabel: 'Dimmer de Grupo',
        description: 'Submaster de pares LED e wash',
      },
      group_fx: {
        label: 'Grupo: FX / Barras',
        categoryLabel: 'Dimmer de Grupo',
        description: 'Submaster de barras pixel e equipamentos de efeito',
      },
      group_smoke: {
        label: 'Grupo: Fumo / Haze',
        categoryLabel: 'Dimmer de Grupo',
        description: 'Nível contínuo da máquina de fumo / haze',
      },
      fx_strobe: {
        label: 'Flash: Strobe',
        categoryLabel: 'Disparo FX',
        description: 'Disparo rápido de strobe branco',
      },
      fx_blinder: {
        label: 'Flash: Blinder',
        categoryLabel: 'Disparo FX',
        description: 'Sobrepor blinder máximo ao público',
      },
      fx_smoke: {
        label: 'Flash: Jato de Fumo',
        categoryLabel: 'Disparo FX',
        description: 'Disparo momentâneo da máquina de fumo',
      },
      fx_blackout: {
        label: 'Alternar: Blackout',
        categoryLabel: 'Disparo FX',
        description: 'Silenciar toda a saída dimmer DMX',
      },
      fx_freeze: {
        label: 'Alternar: Congelar',
        categoryLabel: 'Disparo FX',
        description: 'Congelar a trama DMX atual',
      },
      fx_tap_bpm: {
        label: 'Disparo: Tap BPM',
        categoryLabel: 'Disparo FX',
        description: 'Deteção manual de tempo (Tap Tempo)',
      },
      fx_move_toggle: {
        label: 'Motor: Move FX Ligar/Desl.',
        categoryLabel: 'Disparo FX',
        description: 'Ativar ou pausar o gerador de movimento',
      },
      fx_color_toggle: {
        label: 'Motor: Color FX Ligar/Desl.',
        categoryLabel: 'Disparo FX',
        description: 'Ativar ou pausar o gerador de cor',
      },
      fx_gobo_spin: {
        label: 'Beam FX: Rotação Gobo',
        categoryLabel: 'Disparo FX',
        description: 'Alternar rotação de gobos nas cabeças móveis',
      },
      fx_prism: {
        label: 'Beam FX: Prisma 3 Faces',
        categoryLabel: 'Disparo FX',
        description: 'Dividir feixe através de prisma',
      },
      fx_iris_pulse: {
        label: 'Beam FX: Pulso Íris',
        categoryLabel: 'Disparo FX',
        description: 'Pulso de íris sincronizado com a batida',
      },
      fx_uv_mode: {
        label: 'Beam FX: Luz UV',
        categoryLabel: 'Disparo FX',
        description: 'Modo ultravioleta profundo',
      },
      fx_move_speed: {
        label: 'Move FX: Velocidade',
        categoryLabel: 'Parâmetro FX',
        description: 'Velocidade de movimento Pan/Tilt (0–100%)',
      },
      fx_move_size: {
        label: 'Move FX: Amplitude',
        categoryLabel: 'Parâmetro FX',
        description: 'Amplitude da varredura de movimento (0–100%)',
      },
      fx_color_speed: {
        label: 'Color FX: Velocidade',
        categoryLabel: 'Parâmetro FX',
        description: 'Ritmo da sequência de cores (0–100%)',
      },
      fx_color_fade: {
        label: 'Color FX: Suavização (Fade)',
        categoryLabel: 'Parâmetro FX',
        description: 'Suavidade da transição RGB (0–100%)',
      },
      fx_color_shift: {
        label: 'Color FX: Desfasamento',
        categoryLabel: 'Parâmetro FX',
        description: 'Desfasamento de cor entre equipamentos (0–100%)',
      },
      fx_beam_zoom: {
        label: 'Beam FX: Zoom / Abertura',
        categoryLabel: 'Parâmetro FX',
        description: 'Ângulo de abertura do feixe (0–100%)',
      },
      fx_strobe_rate: {
        label: 'Flash FX: Frequência Strobe',
        categoryLabel: 'Parâmetro FX',
        description: 'Frequência de disparo do strobe (2–24 Hz)',
      },
    },

    wifiPairingTitle: 'Ligação Wi-Fi Windows ↔ Tablet Android',
    wifiPairingSubtitle: 'Sincronização WebSocket em tempo real através do teu router Wi-Fi local',
    syncConnected: 'Sincronizado em Direto',
    syncConnecting: 'A ligar...',
    syncReconnecting: 'A religar...',
    syncStandalone: 'Modo Autónomo Offline',
    standaloneNetworkNotice:
      'A correr diretamente a partir de uma pasta local (file://). O motor de iluminação, visualizador, presets e backups funcionam localmente. Executa Start-LightViana-Windows.bat para sincronização Wi-Fi com tablet e Art-Net UDP.',
    refreshWifiAria: 'Atualizar endereços Wi-Fi',
    generatingQr: 'A gerar QR...',
    scanQrHint: 'Lê com a câmara do Tablet Android',
    tabletUrlLabel: 'URL Wi-Fi para Tablet Android',
    detectingIp: 'A detetar IP local...',
    copiedBtn: 'Copiado',
    copyBtn: 'Copiar',
    detectedLanIps: 'IPs LAN detetados:',
    roomCodeLabel: 'Código da Sala',
    joinBtn: 'Entrar',
    deviceNameLabel: 'Nome deste Dispositivo',
    roleWindows: 'PC Windows',
    roleAndroid: 'Tablet Android',
    roleWeb: 'Web',
    tabletModeOn: 'Modo Tátil Tablet: Ativo',
    tabletModeOff: 'Modo Tátil Tablet: Desligado',
    connectedDevicesIn: (r) => `Dispositivos Ligados em ${r}`,
    onlineCount: (c) => `${c} online`,
    waitingDevices: 'À espera de dispositivos...',
    thisDeviceTag: '(Este dispositivo)',
    artNetTitle: 'Saída Art-Net DMX (Windows)',
    artNetSubtitle: 'Envia pacotes UDP ArtDmx de 512 canais reais na porta 6454',
    artNetTransmitting: 'A Transmitir',
    artNetDisabled: 'Desativado',
    artNetIpLabel: 'IP de Destino / Broadcast',
    artNetUniLabel: 'Universo',
    artNetPacketsSent: (c) => `Pacotes enviados: ${c}`,
    artNetApplyBtn: 'Aplicar Art-Net',
    installTitle: 'Instalação Windows & Android',
    installSubtitle: 'Instala como aplicação independente ou executa localmente no Windows 10/11',
    downloadBatBtn: 'Descarregar .BAT Windows',
    installStep1Before: '1. No PC Windows: executa',
    installStep1After: '(usa Node.js 22+ na porta 3000).',
    installStep2: '2. Liga o PC Windows e o Tablet Android à mesma rede Wi-Fi.',
    installStep3Before: '3. Lê o código QR acima no Chrome do Android e toca em',
    installStep3Strong: 'Adicionar ao ecrã principal',
    installStep3After: 'para controlo DMX sem fios em ecrã inteiro.',
    netSettingsCardTitle: 'Configurações da Aplicação',
    netSettingsCardSubtitle: 'Escolhe o idioma de apresentação de toda a consola',

    pwaInstalled: 'Instalada como Aplicação Independente',
    pwaInstallBtn: 'Instalar Aplicação (Windows / Android)',
    pwaIosBtn: 'Instalar no iPad / iPhone',
    pwaIosModalTitle: 'Instalar no iPad / iPhone',
    pwaIosStep1Before: '1. Toca no botão',
    pwaIosStep1Strong: 'Partilhar',
    pwaIosStep1After: 'no Safari.',
    pwaIosStep2Before: '2. Desliza para baixo e toca em',
    pwaIosStep2Strong: 'Adicionar ao Ecrã Principal',
    pwaManualHint:
      'Menu do navegador → Instalar LightViana (ou Adicionar ao Ecrã Principal no Android Chrome)',
    offlineBanner: 'Modo Offline — Motor de iluminação local ativo',

    channelLabels: {
      movingHead: [
        'Pan',
        'Pan Fino',
        'Tilt',
        'Tilt Fino',
        'Dimmer',
        'Obturador / Strobe',
        'Vermelho',
        'Verde',
        'Azul',
        'Branco',
        'Gobo',
        'Prisma',
        'Zoom / Foco',
        'Vel. Pan/Tilt',
        'Macro',
        'Controlo',
      ],
      ledPar: ['Dimmer', 'Vermelho', 'Verde', 'Azul', 'Branco', 'Strobe', 'Macro'],
      blinder: ['Dimmer Quente A', 'Dimmer Quente B', 'Strobe', 'Macro'],
      fogger: ['Saída Fumo', 'Vel. Ventoinha'],
    },
  },
};
